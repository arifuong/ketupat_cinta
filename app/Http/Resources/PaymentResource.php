<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_id' => $this->order_id,
            'order_number' => $this->order?->order_number,
            'invoice_number' => $this->order?->resellerInvoice?->invoice_number,
            'customer_name' => $this->order?->user?->name,
            'order' => new OrderResource($this->whenLoaded('order')),
            'method' => $this->method->value,
            'method_label' => $this->method->label(),
            'payment_status' => $this->payment_status->value,
            'payment_status_label' => $this->payment_status->label(),
            'proof_image_url' => $this->proof_image_url
                ? asset('storage/proofs/' . $this->proof_image_url)
                : null,
            'amount' => $this->amount,
            'paid_at' => $this->paid_at?->toISOString(),
            'expired_at' => $this->expired_at?->toISOString(),
            'verified_at' => $this->verified_at?->toISOString(),
            'created_at' => $this->created_at->toISOString(),
            'gateway_order_id' => $this->when($request->user()?->isAdmin(), $this->gateway_order_id),
        ];
    }
}
