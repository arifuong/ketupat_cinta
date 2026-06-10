<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payment\UploadProofRequest;
use App\Http\Resources\PaymentResource;
use App\Models\Order;
use App\Services\MidtransService;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(
        private PaymentService $paymentService,
        private MidtransService $midtransService,
    ) {}

    /**
     * Upload payment proof for manual transfer.
     */
    public function upload(UploadProofRequest $request, int $orderId): JsonResponse
    {
        $order = Order::forUser($request->user()->id)->findOrFail($orderId);

        $payment = $this->paymentService->uploadProof(
            $order,
            $request->file('proof_image'),
        );

        return response()->json([
            'success' => true,
            'message' => 'Bukti pembayaran berhasil diunggah. Menunggu verifikasi admin.',
            'data' => new PaymentResource($payment),
        ]);
    }

    /**
     * Initiate Midtrans gateway payment.
     */
    public function gateway(Request $request, int $orderId): JsonResponse
    {
        $order = Order::forUser($request->user()->id)
            ->with(['items.product', 'payment', 'user'])
            ->findOrFail($orderId);

        $result = $this->midtransService->createTransaction($order);

        return response()->json([
            'success' => true,
            'message' => 'Transaksi Midtrans berhasil dibuat.',
            'data' => $result,
        ]);
    }
}
