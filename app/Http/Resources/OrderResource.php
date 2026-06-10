<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'user' => new UserResource($this->whenLoaded('user')),
            'address' => $this->whenLoaded('address', fn () => [
                'label' => $this->address->label,
                'detail' => $this->address->detail,
                'city' => is_object($this->address->city) ? $this->address->city->label() : $this->address->city,
                'district' => $this->address->district,
                'map_link' => $this->address->map_link,
            ]),
            'subtotal_amount' => $this->subtotal_amount,
            'shipping_cost' => $this->shipping_cost,
            'total_amount' => $this->total_amount,
            'shipping_method' => $this->shipping_method->value,
            'shipping_method_label' => $this->shipping_method->label(),
            'payment_type' => $this->payment_type->value,
            'payment_type_label' => $this->payment_type->label(),
            'order_status' => $this->order_status->value,
            'order_status_label' => $this->order_status->label(),
            'notes' => $this->notes,
            'cancel_reason' => $this->cancel_reason,
            'expired_at' => $this->expired_at?->toISOString(),
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'payment' => new PaymentResource($this->whenLoaded('payment')),
            'shipment' => new ShipmentResource($this->whenLoaded('shipment')),
            'reseller_invoice' => new InvoiceResource($this->whenLoaded('resellerInvoice')),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}
