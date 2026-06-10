<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\PoSchedule;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class CartService
{
    /**
     * Add item to cart.
     */
    public function addItem(User $user, int $productId, int $poScheduleId, int $qty): Cart
    {
        $schedule = PoSchedule::with('product')->findOrFail($poScheduleId);

        // Validate product matches
        if ($schedule->product_id !== $productId) {
            throw ValidationException::withMessages([
                'product' => ['Produk tidak sesuai dengan jadwal PO.'],
            ]);
        }

        // Validate schedule is available
        if (!$schedule->hasStock($qty)) {
            throw ValidationException::withMessages([
                'stock' => ['Stok PO tidak mencukupi. Tersisa: ' . $schedule->remaining_stock],
            ]);
        }

        // Validate MOQ for resellers
        if ($user->isReseller()) {
            $minOrder = $schedule->product->min_order_reseller;
            if ($qty < $minOrder) {
                throw ValidationException::withMessages([
                    'moq' => ["Minimal pembelian reseller adalah {$minOrder}"],
                ]);
            }
        }

        // Upsert cart item
        $cart = Cart::updateOrCreate(
            [
                'user_id' => $user->id,
                'product_id' => $productId,
                'po_schedule_id' => $poScheduleId,
            ],
            ['qty' => $qty]
        );

        return $cart->load(['product', 'poSchedule']);
    }

    /**
     * Update cart item quantity.
     */
    public function updateQty(User $user, int $cartId, int $qty): Cart
    {
        $cart = Cart::where('id', $cartId)
            ->where('user_id', $user->id)
            ->with(['product', 'poSchedule'])
            ->firstOrFail();

        // Validate stock
        if (!$cart->poSchedule->hasStock($qty)) {
            throw ValidationException::withMessages([
                'stock' => ['Stok PO tidak mencukupi. Tersisa: ' . $cart->poSchedule->remaining_stock],
            ]);
        }

        // Validate MOQ
        if ($user->isReseller()) {
            $minOrder = $cart->product->min_order_reseller;
            if ($qty < $minOrder) {
                throw ValidationException::withMessages([
                    'moq' => ["Minimal pembelian reseller adalah {$minOrder}"],
                ]);
            }
        }

        $cart->update(['qty' => $qty]);

        return $cart->fresh(['product', 'poSchedule']);
    }

    /**
     * Remove item from cart.
     */
    public function removeItem(User $user, int $cartId): void
    {
        Cart::where('id', $cartId)
            ->where('user_id', $user->id)
            ->delete();
    }

    /**
     * Get all cart items for user.
     */
    public function getItems(User $user)
    {
        return Cart::where('user_id', $user->id)
            ->with(['product', 'poSchedule.product'])
            ->get();
    }

    /**
     * Validate entire cart for checkout readiness.
     */
    public function validateCart(User $user): array
    {
        $items = $this->getItems($user);
        $errors = [];

        foreach ($items as $item) {
            if (!$item->poSchedule->hasStock($item->qty)) {
                $errors[] = "Stok {$item->product->name} tidak mencukupi. Tersisa: {$item->poSchedule->remaining_stock}";
            }

            if ($user->isReseller() && $item->qty < $item->product->min_order_reseller) {
                $errors[] = "MOQ reseller untuk {$item->product->name} adalah {$item->product->min_order_reseller}";
            }
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'items' => $items,
        ];
    }
}
