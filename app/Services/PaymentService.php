<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Models\Payment;
use App\Models\PoSchedule;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class PaymentService
{
    public function __construct(
        private NotificationService $notificationService,
        private ActivityLogService $activityLogService,
    ) {}

    /**
     * Upload payment proof (manual transfer/QRIS).
     */
    public function uploadProof(Order $order, UploadedFile $file): Payment
    {
        $payment = $order->payment;

        if (!$payment || !$payment->isManual()) {
            throw ValidationException::withMessages([
                'payment' => ['Metode pembayaran ini tidak mendukung upload bukti.'],
            ]);
        }

        if ($payment->isPaid()) {
            throw ValidationException::withMessages([
                'payment' => ['Pembayaran sudah berhasil dikonfirmasi.'],
            ]);
        }

        // Validate image corruption
        if (@getimagesize($file->getRealPath()) === false) {
            throw ValidationException::withMessages([
                'proof_image' => ['Bukti pembayaran harus berupa gambar JPG, JPEG, PNG, atau WEBP.'],
                'receipt_image' => ['Bukti pembayaran harus berupa gambar JPG, JPEG, PNG, atau WEBP.'],
            ]);
        }

        // Delete old file if user uploads new one before verification
        if (!empty($payment->proof_image_url)) {
            Storage::disk('proofs')->delete($payment->proof_image_url);
        }

        // Store proof image
        $path = $file->store('', 'proofs');
        $url = Storage::disk('proofs')->url($path);

        $payment->update([
            'proof_image_url' => $path,
            'payment_status' => PaymentStatus::MENUNGGU_VERIFIKASI,
        ]);

        $order->update(['order_status' => OrderStatus::WAITING_VERIFICATION]);

        // Notify admin
        $this->notificationService->sendPaymentUploadedToAdmin($order);

        return $payment->fresh();
    }

    /**
     * Admin verifies payment (approve or reject).
     */
    public function verifyPayment(Payment $payment, bool $approved, User $admin): Payment
    {
        return DB::transaction(function () use ($payment, $approved, $admin) {
            if ($payment->payment_status === PaymentStatus::PEMBAYARAN_BERHASIL || $payment->payment_status === PaymentStatus::PEMBAYARAN_DITOLAK) {
                throw ValidationException::withMessages([
                    'payment' => ['Pembayaran ini sudah diproses sebelumnya.'],
                ]);
            }

            $order = $payment->order;

            if ($approved) {
                // Approve payment
                $payment->update([
                    'payment_status' => PaymentStatus::PEMBAYARAN_BERHASIL,
                    'verified_by' => $admin->id,
                    'verified_at' => now(),
                    'paid_at' => now(),
                ]);

                // Decrement stock for each order item
                foreach ($order->items as $item) {
                    $schedule = PoSchedule::lockForUpdate()->find($item->po_schedule_id);
                    if ($schedule) {
                        $schedule->decrementStock($item->qty);
                    }
                }

                // Update order status only if not already processing or further
                if ($order->order_status !== OrderStatus::PROCESSING && in_array($order->order_status, [OrderStatus::PENDING_PAYMENT, OrderStatus::WAITING_VERIFICATION])) {
                    $order->update(['order_status' => OrderStatus::PROCESSING]);
                }

                // Send success notification
                $this->notificationService->sendPaymentSuccess($order);

            } else {
                // Reject payment
                $payment->update([
                    'payment_status' => PaymentStatus::PEMBAYARAN_DITOLAK,
                    'verified_by' => $admin->id,
                    'verified_at' => now(),
                ]);
            }

            // Log activity
            $this->activityLogService->log($admin, $approved ? 'approve_payment' : 'reject_payment', $payment);

            return $payment->fresh();
        });
    }

    /**
     * Handle Midtrans webhook notification.
     */
    public function handleWebhook(array $data): Payment
    {
        return DB::transaction(function () use ($data) {
            $gatewayOrderId = $data['order_id'];
            $transactionStatus = $data['transaction_status'];
            $fraudStatus = $data['fraud_status'] ?? 'accept';

            $payment = Payment::where('gateway_order_id', $gatewayOrderId)
                ->lockForUpdate()
                ->firstOrFail();

            $order = $payment->order;

            // Already processed
            if ($payment->isPaid()) {
                return $payment;
            }

            $payment->update([
                'gateway_transaction_id' => $data['transaction_id'] ?? null,
                'gateway_response' => $data,
            ]);

            if (in_array($transactionStatus, ['capture', 'settlement'])) {
                if ($fraudStatus === 'accept') {
                    $payment->update([
                        'payment_status' => PaymentStatus::PEMBAYARAN_BERHASIL,
                        'paid_at' => now(),
                    ]);

                    // Decrement stock
                    foreach ($order->items as $item) {
                        $schedule = PoSchedule::lockForUpdate()->find($item->po_schedule_id);
                        if ($schedule) {
                            $schedule->decrementStock($item->qty);
                        }
                    }

                    // Update order
                    $order->update(['order_status' => OrderStatus::PROCESSING]);

                    // Notify
                    $this->notificationService->sendPaymentSuccess($order);
                }
            } elseif (in_array($transactionStatus, ['deny', 'cancel', 'expire'])) {
                $payment->update([
                    'payment_status' => PaymentStatus::PEMBAYARAN_DITOLAK,
                ]);
            }

            return $payment->fresh();
        });
    }
}
