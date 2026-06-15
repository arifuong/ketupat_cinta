<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\Cart;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\PoSchedule;
use App\Models\ResellerInvoice;
use App\Models\ShippingRate;
use App\Models\User;
use App\Models\UserAddress;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderService
{
    public function __construct(
        private NotificationService $notificationService,
        private ActivityLogService $activityLogService,
    ) {}

    /**
     * Create a new order from user's cart items.
     * Uses DB transaction + row locking to prevent overselling.
     */
    public function createOrder(User $user, array $data): Order
    {
        return DB::transaction(function () use ($user, $data) {
            // 1. Validate address belongs to user
            $address = UserAddress::where('id', $data['address_id'])
                ->where('user_id', $user->id)
                ->firstOrFail();

            // Enforce allowed city constraint (business rule)
            $allowedCities = [
                \App\Enums\City::BANDUNG->value,
                \App\Enums\City::CIMAHI->value,
            ];
            $cityValue = is_object($address->city) ? $address->city->value : $address->city;
            if (!in_array($cityValue, $allowedCities, true)) {
                throw ValidationException::withMessages([
                    'address' => ['Pengiriman hanya tersedia untuk Bandung atau Cimahi.'],
                ]);
            }

            // 2. Get cart items
            $cartItems = Cart::where('user_id', $user->id)
                ->with(['product', 'poSchedule'])
                ->get();

            if ($cartItems->isEmpty()) {
                throw ValidationException::withMessages([
                    'cart' => ['Keranjang belanja kosong.'],
                ]);
            }

            // 3. Determine payment method mapping
            $paymentType = $data['payment_type'];
            $paymentMethod = $this->resolvePaymentMethod($paymentType, $user);

            // 4. Validate and lock stock for each item
            $subtotalAmount = '0.00';
            $orderItemsData = [];

            foreach ($cartItems as $cartItem) {
                // Lock the PO schedule row to prevent race condition
                $schedule = PoSchedule::lockForUpdate()
                    ->findOrFail($cartItem->po_schedule_id);

                // Validate product status is active
                if ($cartItem->product->status === 'inactive') {
                    throw ValidationException::withMessages([
                        'product' => ['Produk sudah tidak tersedia.'],
                    ]);
                }

                // Validate stock availability
                if (!$schedule->hasStock($cartItem->qty)) {
                    throw ValidationException::withMessages([
                        'stock' => ["Stok untuk {$cartItem->product->name} pada tanggal {$schedule->schedule_date->format('d/m/Y')} tidak mencukupi. Tersisa: {$schedule->remaining_stock}"],
                    ]);
                }

                // Validate MOQ for resellers
                if ($user->isReseller()) {
                    $minOrder = $cartItem->product->min_order_reseller;
                    if ($cartItem->qty < $minOrder) {
                        throw ValidationException::withMessages([
                            'moq' => ["Minimal pembelian reseller untuk {$cartItem->product->name} adalah {$minOrder}"],
                        ]);
                    }
                }

                // Calculate price based on role
                $unitPrice = $cartItem->product->getPriceForRole($user->role);
                $itemSubtotal = bcmul($unitPrice, (string) $cartItem->qty, 2);
                $subtotalAmount = bcadd($subtotalAmount, $itemSubtotal, 2);

                $orderItemsData[] = [
                    'product_id' => $cartItem->product_id,
                    'po_schedule_id' => $cartItem->po_schedule_id,
                    'qty' => $cartItem->qty,
                    'unit_price' => $unitPrice,
                    'subtotal' => $itemSubtotal,
                    'schedule' => $schedule, // pass for stock decrement later
                ];
            }

            // 5. Calculate shipping cost
            $shippingMethod = \App\Enums\ShippingMethod::from($data['shipping_method']);
            $shippingCost = ShippingRate::getCost($shippingMethod, $address->city);
            $totalAmount = bcadd($subtotalAmount, $shippingCost, 2);

            // 6. Create order
            $order = Order::create([
                'user_id' => $user->id,
                'address_id' => $address->id,
                'subtotal_amount' => $subtotalAmount,
                'shipping_cost' => $shippingCost,
                'total_amount' => $totalAmount,
                'shipping_method' => $data['shipping_method'],
                'payment_type' => $paymentMethod->value,
                'order_status' => $paymentMethod->isTempo()
                    ? OrderStatus::PROCESSING
                    : OrderStatus::PENDING_PAYMENT,
                'notes' => $data['notes'] ?? null,
                'expired_at' => $paymentMethod->isTempo()
                    ? null
                    : now()->addHours(24),
            ]);

            // 7. Create order items
            foreach ($orderItemsData as $itemData) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $itemData['product_id'],
                    'po_schedule_id' => $itemData['po_schedule_id'],
                    'qty' => $itemData['qty'],
                    'unit_price' => $itemData['unit_price'],
                    'subtotal' => $itemData['subtotal'],
                ]);

                // For tempo: decrement stock immediately (payment is deferred but guaranteed)
                if ($paymentMethod->isTempo()) {
                    $itemData['schedule']->decrementStock($itemData['qty']);
                }
            }

            // 8. Create payment record
            $payment = Payment::create([
                'order_id' => $order->id,
                'method' => $paymentMethod->value,
                'payment_status' => $paymentMethod->isTempo()
                    ? PaymentStatus::PEMBAYARAN_BERHASIL
                    : PaymentStatus::MENUNGGU_PEMBAYARAN,
                'amount' => $totalAmount,
                'expired_at' => $paymentMethod->isTempo()
                    ? null
                    : now()->addHours(24),
                'paid_at' => $paymentMethod->isTempo() ? now() : null,
            ]);

            // 9. Create reseller invoice for tempo
            if ($paymentMethod->isTempo()) {
                $installmentCount = 10;
                $installmentAmount = bcdiv($totalAmount, '10', 2);

                ResellerInvoice::create([
                    'user_id' => $user->id,
                    'order_id' => $order->id,
                    'total_debt' => $totalAmount,
                    'installment_count' => $installmentCount,
                    'current_installment' => 0,
                    'installment_amount' => $installmentAmount,
                    'paid_amount' => 0,
                    'due_date' => now()->addDays(14), // Initial due date: 14 days
                    'status' => \App\Enums\InvoiceStatus::MENUNGGU_PEMBAYARAN,
                ]);
            }

            // 10. Clear cart
            Cart::where('user_id', $user->id)->delete();

            // 11. Send notification
            $this->notificationService->sendOrderCreated($order);

            return $order->load(['items.product', 'payment', 'address']);
        });
    }

    /**
     * Update order status (admin only by convention). Enforces sequential transitions.
     */
    public function updateStatus(Order $order, OrderStatus $newStatus, ?User $admin = null): Order
    {
        if (!$order->canTransitionTo($newStatus)) {
            throw ValidationException::withMessages([
                'order_status' => ["Tidak dapat mengubah status dari '{$order->order_status->label()}' ke '{$newStatus->label()}'."],
            ]);
        }

        // Hard guard: completed hanya boleh terjadi setelah konfirmasi dari customer/reseller.
        // Jika pemanggil adalah admin (diindikasikan admin parameter tidak null), blok COMPLETED.
        if ($newStatus === OrderStatus::COMPLETED && $admin) {
            throw ValidationException::withMessages([
                'order_status' => ['Admin tidak dapat mengubah status pesanan menjadi selesai (completed).'],
            ]);
        }

        $oldStatus = $order->order_status;

        $order->update(['order_status' => $newStatus]);

        // If order completed and is tempo, update invoice due_date
        if ($newStatus === OrderStatus::COMPLETED && $order->isTempo()) {
            $invoice = $order->resellerInvoice;
            if ($invoice) {
                $invoice->update([
                    'due_date' => now()->addDays(7),
                    'status' => \App\Enums\InvoiceStatus::MENUNGGU_PEMBAYARAN,
                ]);
            }
        }


        // Log activity
        if ($admin) {
            $this->activityLogService->log($admin, 'update_order_status', $order, [
                'old_status' => $oldStatus->value,
                'new_status' => $newStatus->value,
            ]);
        }

        // Notify via WA if applicable
        if ($newStatus->shouldNotifyWhatsApp()) {
            $this->notificationService->sendOrderStatusUpdate($order);
        }

        return $order->fresh();
    }

    /**
     * Cancel expired orders and return stock.
     */
    public function cancelExpiredOrders(): int
    {
        $expiredOrders = Order::expired()
            ->with('items')
            ->get();

        $count = 0;
        foreach ($expiredOrders as $order) {
            DB::transaction(function () use ($order) {
                $order->update(['order_status' => OrderStatus::CANCELLED]);

                if ($order->payment) {
                    $order->payment->update([
                        'payment_status' => PaymentStatus::PEMBAYARAN_DITOLAK,
                    ]);
                }
            });
            $count++;
        }

        return $count;
    }

    public function confirmReceived(Order $order, User $user): Order
    {
        if ($order->user_id !== $user->id) {
            abort(404);
        }

        if ($order->order_status !== OrderStatus::SHIPPED) {
            throw ValidationException::withMessages([
                'order_status' => ['Barang hanya dapat dikonfirmasi diterima saat status pesanan dikirim.'],
            ]);
        }

        // completed hanya boleh terjadi setelah konfirmasi.
        // Di updateStatus, admin dilindungi sehingga hanya actor null yang bisa mencapai completed.
        return $this->updateStatus($order, OrderStatus::COMPLETED, null);
    }


    public function cancelByCustomer(Order $order, User $user, ?string $reason = null): Order
    {
        if ($order->user_id !== $user->id) {
            abort(404);
        }

        // Customer/reseller hanya boleh batal sebelum status processing.
        // Jika status sudah processing atau shipped maka pembatalan ditolak.
        if (!in_array($order->order_status, [OrderStatus::PENDING_PAYMENT, OrderStatus::WAITING_VERIFICATION], true)) {
            throw ValidationException::withMessages([
                'order_status' => ['Pesanan hanya dapat dibatalkan sebelum processing. Jika sudah processing atau shipped, pembatalan ditolak.'],
            ]);
        }



        return $this->cancelOrder($order, $reason, $user);
    }

    public function cancelByAdmin(Order $order, User $admin, string $reason): Order
    {
        return $this->cancelOrder($order, $reason, $admin);
    }

    private function cancelOrder(Order $order, ?string $reason, User $actor): Order
    {
        if (in_array($order->order_status, [OrderStatus::COMPLETED, OrderStatus::CANCELLED], true)) {
            throw ValidationException::withMessages([
                'order_status' => ['Pesanan sudah selesai atau dibatalkan.'],
            ]);
        }

        $oldStatus = $order->order_status;
        $order->update([
            'order_status' => OrderStatus::CANCELLED,
            'cancel_reason' => $reason,
        ]);

        $this->activityLogService->log($actor, 'cancel_order', $order, [
            'old_status' => $oldStatus->value,
            'reason' => $reason,
        ]);

        return $order->fresh();
    }

    /**
     * Resolve payment method from payment_type input.
     */
    private function resolvePaymentMethod(string $paymentType, User $user): PaymentMethod
    {
        $pt = strtolower(trim($paymentType));

        if (in_array($pt, ['manual', 'transfer', 'transfer_manual'], true)) {
            return PaymentMethod::TRANSFER_MANUAL;
        }

        if (in_array($pt, ['qris', 'qris_manual'], true)) {
            return PaymentMethod::QRIS_MANUAL;
        }

        if (in_array($pt, ['gateway', 'midtrans'], true)) {
            return PaymentMethod::MIDTRANS;
        }

        if ($pt === 'tempo') {
            return PaymentMethod::TEMPO;
        }

        try {
            return PaymentMethod::from($paymentType);
        } catch (\ValueError $e) {
            throw ValidationException::withMessages([
                'payment_type' => ['Metode pembayaran tidak valid. Gunakan: transfer_manual, qris_manual, midtrans, tempo.'],
            ]);
        }
    }
}
