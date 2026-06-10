<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'invoice_number' => $this->invoice_number,
            'user' => new UserResource($this->whenLoaded('user')),
            'order' => new OrderResource($this->whenLoaded('order')),
            'total_debt' => $this->total_debt,
            'paid_amount' => $this->paid_amount,
            'remaining_debt' => $this->remaining_debt,
            'due_date' => $this->due_date->format('Y-m-d'),
            'due_date_formatted' => $this->due_date->format('d M Y'),
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'is_overdue' => $this->is_overdue,
            'payments' => $this->whenLoaded('payments'),
            'created_at' => $this->created_at->toISOString(),
        ];
    }
}
