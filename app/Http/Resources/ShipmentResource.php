<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ShipmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'courier_name' => $this->courier_name,
            'courier_wa' => $this->courier_wa,
            'vehicle_plate' => $this->vehicle_plate,
            'vehicle_number' => $this->vehicle_number ?? $this->vehicle_plate,
            'delivery_source' => $this->delivery_source,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'notes' => $this->notes,
            'shipped_at' => $this->shipped_at?->toISOString(),
            'delivered_at' => $this->delivered_at?->toISOString(),
        ];
    }
}
