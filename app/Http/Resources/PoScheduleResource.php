<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PoScheduleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'schedule_date' => $this->schedule_date->format('Y-m-d'),
            'schedule_date_formatted' => $this->schedule_date->format('d M Y'),
            'allocated_stock' => $this->allocated_stock,
            'remaining_stock' => $this->remaining_stock,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'is_available' => $this->status->value === 'open' && $this->remaining_stock > 0,
            'product' => new ProductResource($this->whenLoaded('product')),
        ];
    }
}
