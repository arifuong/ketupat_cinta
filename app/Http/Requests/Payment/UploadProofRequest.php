<?php

namespace App\Http\Requests\Payment;

use Illuminate\Foundation\Http\FormRequest;

class UploadProofRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'proof_image' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:2048'],
        ];
    }

    public function messages(): array
    {
        return [
            'proof_image.max' => 'Ukuran file maksimal 2MB.',
            'proof_image.mimes' => 'Format file harus JPG, PNG, atau PDF.',
        ];
    }
}
