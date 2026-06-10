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
        $request->validate([
            'courier_name' => 'nullable|string|max:100',
            'driver_name' => 'nullable|string|max:100',
            'vehicle_number' => 'nullable|string|max:20',
            'tracking_link' => 'nullable|url|max:500',
            'tracking_number' => 'nullable|string|max:50',
            'notes' => 'nullable|string|max:500',
        ]);

        $order = Order::findOrFail($id);

        // Create or update shipment
        $shipment = Shipment::updateOrCreate(
            ['order_id' => $order->id],
            array_merge($request->only([
                'courier_name', 'driver_name', 'vehicle_number',
                'tracking_link', 'tracking_number', 'notes',
            ]), [
                'status' => 'in_transit',
                'shipped_at' => now(),
            ])
        );

        $this->orderService->updateStatus($order, OrderStatus::SHIPPED, $request->user());

        return response()->json([
            'success' => true,
            'message' => 'Info pengiriman berhasil diupdate. Notifikasi WA dikirim.',
            'data' => new OrderResource($order->fresh(['items.product', 'payment', 'shipment'])),
        ]);
    }
}
