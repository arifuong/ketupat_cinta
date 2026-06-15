<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $request->user();
        $isReseller = $user?->isReseller();

        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'image_url' => $this->imageUrl(),
            'price' => $isReseller ? $this->price_reseller : $this->price_normal,
            'price_normal' => $this->price_normal,
            'price_reseller' => $this->when($isReseller || $user?->isAdmin(), $this->price_reseller),
            'min_order' => $isReseller ? $this->min_order_reseller : $this->min_order_customer,
            'min_order_customer' => $this->min_order_customer,
            'min_order_reseller' => $this->when($isReseller || $user?->isAdmin(), $this->min_order_reseller),
            'stock_po_default' => $this->when($user?->isAdmin(), $this->stock_po_default),
            'status' => $this->status,
            'is_active' => $this->status === 'active',
            'has_transactions' => $this->orderItems()->exists(),
            'po_schedules' => PoScheduleResource::collection($this->whenLoaded('poSchedules')),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }

    private function imageUrl(): ?string
    {
        if (empty($this->image_url)) {
            return null;
        }

        $value = trim((string) $this->image_url);

        // If stored value is already absolute URL, do not change.
        if (str_starts_with($value, 'http://') || str_starts_with($value, 'https://')) {
            return $value;
        }

        // If backend already stores public path like /storage/products/file.jpg
        // Keep it consistent by converting to absolute with asset().
        if (str_starts_with($value, '/storage/')) {
            return asset($value);
        }

        // Normalize possible stored formats:
        // - products/file.jpg
        // - storage/products/file.jpg
        $normalized = ltrim($value, '/');
        $normalized = str_starts_with($normalized, 'storage/')
            ? substr($normalized, strlen('storage/'))
            : $normalized;

        // Build absolute URL WITHOUT double segments.
        // Target format (single): /storage/products/<file>
        // normalized must be: products/<file> or storage/products/<file>
        // We already stripped optional leading "storage/" above.
        return rtrim(config('app.url'), '/') . '/storage/' . $normalized;
    }
}
