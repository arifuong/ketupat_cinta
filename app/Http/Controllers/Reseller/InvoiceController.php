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
            'payment_method' => 'required|in:midtrans,tempo',
            'proof_image' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'receipt_image' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ], [
            'proof_image.image' => 'Bukti pembayaran harus berupa gambar JPG, JPEG, PNG, atau WEBP.',
            'proof_image.mimes' => 'Bukti pembayaran harus berupa gambar JPG, JPEG, PNG, atau WEBP.',
            'proof_image.max' => 'Ukuran bukti pembayaran maksimal 2 MB.',
            'receipt_image.image' => 'Bukti pembayaran harus berupa gambar JPG, JPEG, PNG, atau WEBP.',
            'receipt_image.mimes' => 'Bukti pembayaran harus berupa gambar JPG, JPEG, PNG, atau WEBP.',
            'receipt_image.max' => 'Ukuran bukti pembayaran maksimal 2 MB.',
        ]);

        $invoice = ResellerInvoice::forUser($request->user()->id)->findOrFail($id);

        $file = $request->file('proof_image') ?? $request->file('receipt_image');

        $payment = $this->invoiceService->payInvoice(
            $invoice,
            $request->user(),
            $request->only(['amount', 'payment_method']),
            $file,
        );


        return response()->json([
            'success' => true,
            'message' => 'Pembayaran tagihan berhasil dicatat.',
            'data' => $payment,
        ]);
    }

    public function receipt(Request $request, int $id)
    {
        $invoice = \App\Models\ResellerInvoice::forUser($request->user()->id)
            ->with(['user', 'payments', 'order.items.product'])
            ->findOrFail($id);

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('receipts.invoice', compact('invoice'));
        return $pdf->download("struk-tagihan-{$invoice->invoice_number}.pdf");
    }
}
