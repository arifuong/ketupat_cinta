<?php

namespace App\Http\Controllers\Reseller;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function __construct(private OrderService $orderService) {}

    /**
     * Reseller confirmation: customer/reseller can mark order received.
     */
    public function received(Request $request, int $id): JsonResponse
    {
        // Authorization: reseller only accesses own orders.
        $order = Order::forUser($request->user()->id)
            ->with(['items.product', 'payment', 'shipment', 'address'])
            ->findOrFail($id);

        $order = $this->orderService->confirmReceived($order, $request->user());

        return response()->json([
            'success' => true,
            'message' => 'Pesanan selesai. Terima kasih sudah mengonfirmasi barang diterima.',
            'data' => new OrderResource($order->load(['items.product', 'payment', 'shipment', 'address'])),
        ]);
    }

    /**
     * Reseller cancel order: allowed only before processing.
     * cancel_reason: optional from UI for customer/reseller (admin reason wajib).
     */
    public function cancel(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'cancel_reason' => 'nullable|string|max:1000',
        ]);

        $order = Order::forUser($request->user()->id)->findOrFail($id);
        $order = $this->orderService->cancelByCustomer($order, $request->user(), $request->cancel_reason);

        return response()->json([
            'success' => true,
            'message' => 'Pesanan berhasil dibatalkan.',
            'data' => new OrderResource($order->load(['items.product', 'payment', 'shipment', 'address'])),
        ]);
    }
}

