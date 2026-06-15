<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(private PaymentService $paymentService) {}

    public function index(Request $request): JsonResponse
    {
        $query = Payment::with(['order.user', 'order.resellerInvoice'])->orderByDesc('created_at');

        if ($request->has('status')) {
            $query->where('payment_status', $request->status);
        }

        $payments = $query->paginate(15);

        return response()->json([
            'success' => true,
            'message' => 'Daftar pembayaran.',
            'data' => PaymentResource::collection($payments),
            'meta' => [
                'current_page' => $payments->currentPage(),
                'last_page' => $payments->lastPage(),
                'total' => $payments->total(),
            ],
        ]);
    }

    public function verify(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'approved' => 'required|boolean',
        ]);

        $payment = Payment::with('order.items')->findOrFail($id);

        $payment = $this->paymentService->verifyPayment(
            $payment,
            $request->boolean('approved'),
            $request->user(),
        );

        $message = $request->boolean('approved')
            ? 'Pembayaran disetujui.'
            : 'Pembayaran ditolak.';

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => new PaymentResource($payment),
        ]);
    }
}
