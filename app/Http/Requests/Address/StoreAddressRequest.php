<?php

namespace App\Http\Requests\Address;

use Illuminate\Foundation\Http\FormRequest;

class StoreAddressRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'label' => ['nullable', 'string', 'max:50'],
            'detail' => ['required', 'string', 'max:500'],
            'city' => ['required', 'in:bandung,cimahi'],
            'district' => ['nullable', 'string', 'max:100'],
            'map_link' => ['nullable', 'url', 'max:500'],
            'is_default' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'city.in' => 'Pengiriman hanya untuk wilayah Bandung & Cimahi.',
        ];
    }
}
