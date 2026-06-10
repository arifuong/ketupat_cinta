<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Services\CartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function __construct(private CartService $cartService) {}

    public function index(Request $request): JsonResponse
    {
        $items = $this->cartService->getItems($request->user());

        return response()->json([
            'success' => true,
            'message' => 'Daftar keranjang.',
            'data' => $this->formatItems($items, $request),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        if ($request->user()->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Admin tidak dapat berbelanja.',
                'data' => null,
            ], 403);
        }

        $request->validate([
            'product_id' => 'required|exists:products,id',
            'po_schedule_id' => 'required|exists:po_schedules,id',
            'qty' => 'required|integer|min:1',
        ]);

        $cart = $this->cartService->addItem(
            $request->user(),
            $request->product_id,
            $request->po_schedule_id,
            $request->qty,
        );

        return response()->json([
            'success' => true,
            'message' => 'Produk ditambahkan ke keranjang.',
            'data' => $this->formatItem($cart, $request),
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'qty' => 'required|integer|min:1',
        ]);

        $cart = $this->cartService->updateQty($request->user(), $id, $request->qty);

        return response()->json([
            'success' => true,
            'message' => 'Keranjang diperbarui.',
            'data' => $this->formatItem($cart, $request),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->cartService->removeItem($request->user(), $id);

        return response()->json([
            'success' => true,
            'message' => 'Item dihapus dari keranjang.',
        ]);
    }

    public function validate(Request $request): JsonResponse
    {
        $result = $this->cartService->validateCart($request->user());

        return response()->json([
            'success' => $result['valid'],
            'message' => $result['valid'] ? 'Keranjang siap checkout.' : 'Ada masalah dengan keranjang.',
            'data' => $result,
        ]);
    }

    private function formatItems($items, Request $request)
    {
        return $items->map(fn ($item) => $this->formatItem($item, $request))->values();
    }

    private function formatItem($item, Request $request): array
    {
        $user = $request->user();
        $item->loadMissing(['product', 'poSchedule']);
        $unitPrice = $item->product->getPriceForRole($user->role);
        $product = (new ProductResource($item->product))->resolve($request);
        $product['price'] = $unitPrice;
        $product['min_order'] = $item->product->getMinOrderForRole($user->role);

        return [
            'id' => $item->id,
            'user_id' => $item->user_id,
            'product_id' => $item->product_id,
            'po_schedule_id' => $item->po_schedule_id,
            'qty' => $item->qty,
            'unit_price' => $unitPrice,
            'subtotal' => bcmul((string) $unitPrice, (string) $item->qty, 2),
            'product' => $product,
            'poSchedule' => [
                'id' => $item->poSchedule->id,
                'product_id' => $item->poSchedule->product_id,
                'schedule_date' => $item->poSchedule->schedule_date->format('Y-m-d'),
                'schedule_date_formatted' => $item->poSchedule->schedule_date->format('d M Y'),
                'allocated_stock' => $item->poSchedule->allocated_stock,
                'remaining_stock' => $item->poSchedule->remaining_stock,
                'status' => $item->poSchedule->status->value,
                'status_label' => $item->poSchedule->status->label(),
                'is_available' => $item->poSchedule->status->value === 'open' && $item->poSchedule->remaining_stock > 0,
            ],
        ];
    }
}
