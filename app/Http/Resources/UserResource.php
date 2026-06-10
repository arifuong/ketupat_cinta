<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'wa_number' => $this->wa_number,

            'role' => $this->role?->value ?? 'customer',
            'role_label' => $this->role?->label() ?? 'Customer',

            'is_trusted' => $this->is_trusted ?? false,

            'status' => $this->status?->value ?? 'active',

            'avatar_url' => $this->avatar ? asset('storage/' . $this->avatar) : null,

            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
