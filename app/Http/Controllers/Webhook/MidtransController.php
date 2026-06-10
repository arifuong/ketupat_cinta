<?php

namespace App\Http\Controllers\Webhook;

use App\Http\Controllers\Controller;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MidtransController extends Controller
{
    public function __construct(private PaymentService $paymentService) {}

    /**
     * Handle Midtrans webhook notification.
     * Signature is validated by ValidateMidtransSignature middleware.
     */
    public function handle(Request $request): JsonResponse
    {
        $this->paymentService->handleWebhook($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Webhook processed.',
        ]);
    }
}
