<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Shipment;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function __construct(private OrderService $orderService) {}

    public function index(Request $request): JsonResponse
    {
        $query = Order::with(['user', 'items.product', 'payment', 'shipment'])
            ->orderByDesc('created_at');

        if ($request->has('status')) {
            $query->where('order_status', $request->status);
        }
        if ($request->has('payment_type')) {
            $query->where('payment_type', $request->payment_type);
        }
        if ($request->has('user_role')) {
            $query->whereHas('user', fn ($q) => $q->where('role', $request->user_role));
        }

        $orders = $query->paginate(15);

        return response()->json([
            'success' => true,
            'message' => 'Daftar pesanan.',
            'data' => OrderResource::collection($orders),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'total' => $orders->total(),
            ],
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $order = Order::with(['user', 'items.product', 'items.poSchedule', 'payment', 'shipment', 'address', 'resellerInvoice.payments'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'message' => 'Detail pesanan.',
            'data' => new OrderResource($order),
        ]);
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'order_status' => 'required|in:' . implode(',', array_column(OrderStatus::cases(), 'value')),
        ]);

        $order = Order::findOrFail($id);
        $newStatus = OrderStatus::from($request->order_status);

        if ($newStatus !== OrderStatus::PROCESSING) {
            return response()->json([
                'success' => false,
                'message' => 'Gunakan endpoint khusus untuk verifikasi pembayaran, pengiriman, atau pembatalan pesanan.',
                'data' => null,
            ], 422);
        }

        $order->loadMissing('payment');
        if (!$order->payment?->isPaid()) {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan hanya dapat diproses setelah pembayaran berhasil diverifikasi.',
                'data' => null,
            ], 422);
        }

        $order = $this->orderService->updateStatus($order, $newStatus, $request->user());

        return response()->json([
            'success' => true,
            'message' => "Status pesanan diubah ke '{$newStatus->label()}'.",
            'data' => new OrderResource($order->load(['items.product', 'payment', 'shipment'])),
        ]);
    }

    public function cancel(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'cancel_reason' => 'required|string|max:1000',
        ]);


        $order = Order::findOrFail($id);
        $order = $this->orderService->cancelByAdmin($order, $request->user(), $request->cancel_reason);

        return response()->json([
            'success' => true,
            'message' => 'Pesanan berhasil dibatalkan.',
            'data' => new OrderResource($order->load(['items.product', 'payment', 'shipment'])),
        ]);
    }

    public function ship(Request $request, int $id): JsonResponse
    {
        $order = Order::with('shipment')->findOrFail($id);

        if ($order->shipping_method->value === 'gosend_customer') {
            // Customer GoSend: admin only clicks "Tandai Dikirim" and does not supply form parameters
            $shipment = $order->shipment;
            if (!$shipment || empty($shipment->courier_name) || empty($shipment->vehicle_plate)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data driver GoSend belum diisi oleh customer.',
                    'data' => null,
                ], 422);
            }
        } else {
            // Store GoSend or Internal Courier: admin fills details
            $request->validate([
                'courier_name' => 'required|string|max:100',
                'vehicle_plate' => 'required|string|max:20',
                'courier_wa' => ['nullable', 'string', 'regex:/^[0-9+]+$/', 'max:20'],
                'notes' => 'nullable|string|max:500',
            ]);

            $shipment = Shipment::updateOrCreate(
                ['order_id' => $order->id],
                [
                    'courier_name' => $request->courier_name,
                    'courier_wa' => $request->courier_wa,
                    'vehicle_number' => $request->vehicle_plate,
                    'vehicle_plate' => $request->vehicle_plate,
                    'delivery_source' => 'store',
                    'notes' => $request->notes,
                ]
            );
        }

        // Set status to in_transit and shipped_at to now
        $shipment->update([
            'status' => 'in_transit',
            'shipped_at' => now(),
        ]);

        $this->orderService->updateStatus($order, OrderStatus::SHIPPED, $request->user());

        return response()->json([
            'success' => true,
            'message' => 'Pesanan berhasil ditandai sebagai dikirim.',
            'data' => new OrderResource($order->fresh(['items.product', 'payment', 'shipment'])),
        ]);
    }
}
