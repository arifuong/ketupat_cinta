<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'wa_number' => [
                'required',
                'string',
                'regex:/^\d+$/',
                'min:10',
                'max:13',
            ],
            'password' => ['required', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'wa_number.regex' => 'Nomor WhatsApp hanya boleh berisi angka.',
            'wa_number.min' => 'Nomor WhatsApp minimal 10 digit.',
            'wa_number.max' => 'Nomor WhatsApp maksimal 13 digit.',
        ];
    }
}
