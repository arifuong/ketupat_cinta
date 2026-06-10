<?php

namespace App\Http\Controllers\Reseller;

use App\Http\Controllers\Controller;
use App\Http\Resources\InvoiceResource;
use App\Models\ResellerInvoice;
use App\Services\InvoiceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    public function __construct(private InvoiceService $invoiceService) {}

    public function index(Request $request): JsonResponse
    {
        $invoices = ResellerInvoice::forUser($request->user()->id)
            ->with(['order', 'payments'])
            ->orderByDesc('created_at')
            ->paginate(10);

        return response()->json([
            'success' => true,
            'message' => 'Daftar tagihan.',
            'data' => InvoiceResource::collection($invoices),
            'meta' => [
                'current_page' => $invoices->currentPage(),
                'last_page' => $invoices->lastPage(),
                'total' => $invoices->total(),
            ],
        ]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $invoice = ResellerInvoice::forUser($request->user()->id)
            ->with(['order.items.product', 'payments'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'message' => 'Detail tagihan.',
            'data' => new InvoiceResource($invoice),
        ]);
    }

    public function pay(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'payment_method' => 'required|in:transfer_manual,midtrans',
            'proof_image' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:2048',
        ]);

        $invoice = ResellerInvoice::forUser($request->user()->id)->findOrFail($id);

        $payment = $this->invoiceService->payInvoice(
            $invoice,
            $request->user(),
            $request->only(['amount', 'payment_method']),
            $request->file('proof_image'),
        );

        return response()->json([
            'success' => true,
            'message' => 'Pembayaran tagihan berhasil dicatat.',
            'data' => $payment,
        ]);
    }
}
