<?php

namespace App\Http\Requests\Address;

use Illuminate\Foundation\Http\FormRequest;

class StoreAddressRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    protected function prepareForValidation()
    {
        if ($this->has('recipient_phone')) {
            $phone = preg_replace('/[^0-9]/', '', $this->recipient_phone);
            if (str_starts_with($phone, '62')) {
                $phone = '0' . substr($phone, 2);
            }
            $this->merge([
                'recipient_phone' => $phone
            ]);
        }

        if ($this->has('maps_link')) {
            $this->merge([
                'map_link' => $this->maps_link
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'label' => ['nullable', 'string', 'max:50'],
            'detail' => ['required', 'string', 'max:500'],
            'city' => ['required', 'in:bandung,cimahi'],
            'district' => ['required', 'string', 'max:100'],
            'map_link' => [
                'required',
                'url',
                'regex:/(google\.com\/maps|maps\.google\.com|maps\.app\.goo\.gl|goo\.gl\/maps)/i'
            ],
            'is_default' => ['nullable', 'boolean'],
            'recipient_name' => ['required', 'string', 'max:255'],
            'recipient_phone' => ['required', 'string', 'regex:/^08[0-9]{8,13}$/'],
            'province' => ['required', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:10'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'city.in' => 'Pengiriman hanya untuk wilayah Bandung & Cimahi.',
            'recipient_phone.regex' => 'Nomor WhatsApp harus diawali dengan 08 dan terdiri dari 10 sampai 15 digit.',
            'map_link.required' => 'Link Google Maps wajib diisi.',
            'map_link.regex' => 'Link Google Maps harus berupa URL Google Maps yang valid.',
        ];
    }
}
