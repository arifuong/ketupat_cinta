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

        // Validate product status
        if ($schedule->product->status === 'inactive') {
            throw ValidationException::withMessages([
                'product' => ['Produk sudah tidak tersedia.'],
            ]);
        }

        // Validate schedule is available
        if (!$schedule->hasStock($qty)) {
            throw ValidationException::withMessages([
                'stock' => ['Stok PO tidak mencukupi. Tersisa: ' . $schedule->remaining_stock],
            ]);
        }

        // Validate MOQ for resellers (Fixed at 10 as per request)
        if ($user->isReseller()) {
            $minOrder = 10;
            if ($qty < $minOrder) {
                throw ValidationException::withMessages([
                    'moq' => ["Minimal pembelian reseller adalah {$minOrder} pcs."],
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

        // Validate product status
        if ($cart->product->status === 'inactive') {
            throw ValidationException::withMessages([
                'product' => ['Produk sudah tidak tersedia.'],
            ]);
        }

        // Validate stock
        if (!$cart->poSchedule->hasStock($qty)) {
            throw ValidationException::withMessages([
                'stock' => ['Stok PO tidak mencukupi. Tersisa: ' . $cart->poSchedule->remaining_stock],
            ]);
        }

        // Validate MOQ (Fixed at 10)
        if ($user->isReseller()) {
            $minOrder = 10;
            if ($qty < $minOrder) {
                throw ValidationException::withMessages([
                    'moq' => ["Minimal pembelian reseller adalah {$minOrder} pcs."],
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
            if ($item->product->status === 'inactive') {
                $errors[] = "Produk sudah tidak tersedia.";
            }

            if (!$item->poSchedule->hasStock($item->qty)) {
                $errors[] = "Stok {$item->product->name} tidak mencukupi. Tersisa: {$item->poSchedule->remaining_stock}";
            }

            if ($user->isReseller() && $item->qty < 10) {
                $errors[] = "Minimal pembelian reseller untuk {$item->product->name} adalah 10 pcs.";
            }
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'items' => $items,
        ];
    }
}
