<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Order\StoreOrderRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function __construct(private OrderService $orderService) {}

    public function index(Request $request): JsonResponse
    {
        $orders = Order::forUser($request->user()->id)
            ->with(['items.product', 'payment', 'shipment'])
            ->orderByDesc('created_at')
            ->paginate(10);

        return response()->json([
            'success' => true,
            'message' => 'Riwayat pesanan.',
            'data' => OrderResource::collection($orders),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'total' => $orders->total(),
            ],
        ]);
    }

    public function store(StoreOrderRequest $request): JsonResponse
    {
        if ($request->user()->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Admin tidak dapat berbelanja.',
                'data' => null,
            ], 403);
        }

        $order = $this->orderService->createOrder($request->user(), $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Pesanan berhasil dibuat.',
            'data' => new OrderResource($order),
        ], 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $order = Order::forUser($request->user()->id)
            ->with(['items.product', 'items.poSchedule', 'payment', 'shipment', 'address', 'resellerInvoice'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'message' => 'Detail pesanan.',
            'data' => new OrderResource($order),
        ]);
    }

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

    public function received(Request $request, int $id): JsonResponse
    {
        $order = Order::forUser($request->user()->id)->findOrFail($id);
        $order = $this->orderService->confirmReceived($order, $request->user());

        return response()->json([
            'success' => true,
            'message' => 'Pesanan selesai. Terima kasih sudah mengonfirmasi barang diterima.',
            'data' => new OrderResource($order->load(['items.product', 'payment', 'shipment', 'address'])),
        ]);
    }

    public function updateGoSendDriver(Request $request, int $id): JsonResponse
    {
        $order = Order::forUser($request->user()->id)
            ->with('shipment')
            ->findOrFail($id);

        if ($order->shipping_method->value !== 'gosend_customer') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya pesanan dengan metode GoSend Customer yang dapat mengisi data driver.',
                'data' => null,
            ], 422);
        }

        $request->validate([
            'courier_name' => 'required|string|max:100',
            'vehicle_plate' => 'required|string|max:20',
        ]);

        // Create or update shipment
        $shipment = \App\Models\Shipment::updateOrCreate(
            ['order_id' => $order->id],
            [
                'courier_name' => $request->courier_name,
                'vehicle_number' => $request->vehicle_plate,
                'vehicle_plate' => $request->vehicle_plate,
                'delivery_source' => 'customer',
                'status' => 'pending',
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Data driver GoSend berhasil disimpan.',
            'data' => new OrderResource($order->fresh(['items.product', 'payment', 'shipment'])),
        ]);
    }

    public function receipt(Request $request, int $id)
    {
        $order = Order::forUser($request->user()->id)
            ->with(['items.product', 'user', 'resellerInvoice', 'payment'])
            ->findOrFail($id);

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('receipts.order', compact('order'));
        return $pdf->download("struk-pesanan-{$order->order_number}.pdf");
    }
}
