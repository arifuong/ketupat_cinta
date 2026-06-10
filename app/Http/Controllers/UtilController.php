<?php

namespace App\Http\Controllers;

use App\Enums\PaymentMethod;
use App\Enums\UserRole;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UtilController extends Controller
{
    /**
     * Get available payment methods based on user role.
     */
    public function getPaymentMethods(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.',
            ], 401);
        }

        $methods = [];

        if ($user->role === UserRole::CUSTOMER) {
            // Customers can only use Midtrans
            $methods = [
                [
                    'value' => PaymentMethod::MIDTRANS->value,
                    'label' => PaymentMethod::MIDTRANS->label(),
                    'description' => 'Pembayaran melalui payment gateway Midtrans',
                ],
            ];
        } elseif ($user->role === UserRole::RESELLER) {
            // Resellers can use Transfer Manual, QRIS Manual, Midtrans, and Tempo (if trusted)
            $methods = [
                [
                    'value' => PaymentMethod::TRANSFER_MANUAL->value,
                    'label' => PaymentMethod::TRANSFER_MANUAL->label(),
                    'description' => 'Transfer ke rekening bisnis',
                ],
                [
                    'value' => PaymentMethod::QRIS_MANUAL->value,
                    'label' => PaymentMethod::QRIS_MANUAL->label(),
                    'description' => 'Pembayaran via QRIS',
                ],
                [
                    'value' => PaymentMethod::MIDTRANS->value,
                    'label' => PaymentMethod::MIDTRANS->label(),
                    'description' => 'Pembayaran melalui payment gateway',
                ],
            ];

            // Add Tempo option if reseller is trusted
            if ($user->isTrustedReseller()) {
                $methods[] = [
                    'value' => PaymentMethod::TEMPO->value,
                    'label' => PaymentMethod::TEMPO->label(),
                    'description' => 'Pembayaran ditunda 7 hari setelah barang diterima',
                ];
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Metode pembayaran tersedia.',
            'data' => $methods,
        ]);
    }
}
