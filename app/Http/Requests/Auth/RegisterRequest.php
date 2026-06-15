<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    protected function prepareForValidation()
    {
        if ($this->has('wa_number')) {
            $phone = preg_replace('/[^0-9]/', '', $this->wa_number);
            if (str_starts_with($phone, '62')) {
                $phone = '0' . substr($phone, 2);
            }
            $this->merge([
                'wa_number' => $phone
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'wa_number' => [
                'required',
                'string',
                'regex:/^08[0-9]{8,13}$/',
                'unique:users,wa_number',
            ],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ];
    }

    public function messages(): array
    {
        return [
            'wa_number.regex' => 'Nomor WhatsApp harus diawali dengan 08 dan terdiri dari 10 sampai 15 digit.',
            'wa_number.unique' => 'Nomor WhatsApp sudah terdaftar.',
        ];
    }
}
