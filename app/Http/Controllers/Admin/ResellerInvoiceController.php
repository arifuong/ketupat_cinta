<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\InvoiceResource;
use App\Models\User;

use App\Services\ResellerInvoiceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ResellerInvoiceController extends Controller
{
    public function __construct(private ResellerInvoiceService $resellerInvoiceService) {}

    public function index(Request $request): JsonResponse
    {
        // List invoices for admin dashboard. For tempo: status=menunggu_pembayaran.
        $invoices = $this->resellerInvoiceService->listInvoices($request);

        return response()->json([
            'success' => true,
            'message' => 'Daftar tagihan reseller.',
            'data' => InvoiceResource::collection($invoices),
            'meta' => [
                'current_page' => $invoices->currentPage(),
                'last_page' => $invoices->lastPage(),
                'total' => $invoices->total(),
            ],
        ]);
    }

    public function verify(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'approved' => 'required|boolean',
        ]);

        $invoice = $this->resellerInvoiceService->verifyInvoice(
            id: $id,
            approved: $request->boolean('approved'),
            admin: $request->user() instanceof User ? $request->user() : $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => $request->boolean('approved') ? 'Tagihan disetujui.' : 'Tagihan ditolak.',
            'data' => new InvoiceResource($invoice),
        ]);
    }

    public function remind(Request $request, int $id): JsonResponse
    {
        $invoice = \App\Models\ResellerInvoice::findOrFail($id);
        
        $this->resellerInvoiceService->remindInvoice($invoice);

        return response()->json([
            'success' => true,
            'message' => 'Notifikasi penagihan telah dikirim.',
        ]);
    }
}

