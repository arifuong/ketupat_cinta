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
            'po_schedules' => PoScheduleResource::collection($this->whenLoaded('poSchedules')),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }

    private function imageUrl(): ?string
    {
        if (!$this->image_url) {
            return null;
        }

        if (str_starts_with($this->image_url, 'http://') || str_starts_with($this->image_url, 'https://')) {
            return $this->image_url;
        }

        if (str_starts_with($this->image_url, '/storage/')) {
            return url($this->image_url);
        }

        return asset('storage/' . ltrim($this->image_url, '/'));
    }
}
