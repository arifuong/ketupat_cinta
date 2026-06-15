<?php

namespace App\Http\Requests\Payment;

use Illuminate\Foundation\Http\FormRequest;

class UploadProofRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'proof_image' => ['required_without:receipt_image', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'receipt_image' => ['required_without:proof_image', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ];
    }

    public function messages(): array
    {
        return [
            'proof_image.required_without' => 'Bukti pembayaran wajib diunggah.',
            'proof_image.image' => 'Bukti pembayaran harus berupa gambar JPG, JPEG, PNG, atau WEBP.',
            'proof_image.mimes' => 'Bukti pembayaran harus berupa gambar JPG, JPEG, PNG, atau WEBP.',
            'proof_image.max' => 'Ukuran bukti pembayaran maksimal 2 MB.',
            'receipt_image.required_without' => 'Bukti pembayaran wajib diunggah.',
            'receipt_image.image' => 'Bukti pembayaran harus berupa gambar JPG, JPEG, PNG, atau WEBP.',
            'receipt_image.mimes' => 'Bukti pembayaran harus berupa gambar JPG, JPEG, PNG, atau WEBP.',
            'receipt_image.max' => 'Ukuran bukti pembayaran maksimal 2 MB.',
        ];
    }
}
