<?php

namespace App\Http\Requests\Order;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $user = $this->user();
        $paymentRules = ['required'];

        // Enforce role-based payment methods
        if ($user && $user->role === UserRole::CUSTOMER) {
            // Customers can only use Midtrans
            $paymentRules[] = 'in:midtrans';
        } elseif ($user && $user->role === UserRole::RESELLER) {
            // Resellers can use Transfer Manual, QRIS Manual, Midtrans, or Tempo
            $paymentRules[] = 'in:transfer_manual,qris_manual,midtrans,tempo';
        } else {
            // Default validation if role not set
            $paymentRules[] = 'in:transfer_manual,qris_manual,midtrans,tempo';
        }

        $rules = [
            'address_id' => ['required', 'exists:user_addresses,id'],
            'shipping_method' => ['required', 'in:gosend_customer,gosend_toko,kurir_internal'],
            'payment_type' => $paymentRules,
            'notes' => ['nullable', 'string', 'max:500'],
        ];

        // Tempo only for trusted resellers
        if ($this->input('payment_type') === 'tempo') {
            $rules['payment_type'][] = function ($attribute, $value, $fail) use ($user) {
                if (!$user || !$user->isTrustedReseller()) {
                    $fail('Hanya reseller terpercaya yang dapat menggunakan pembayaran tempo.');
                }
            };
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'payment_type.in' => 'Metode pembayaran tidak tersedia untuk role Anda.',
        ];
    }
}
