<?php

namespace App\Services;

use App\Enums\InvoiceStatus;
use App\Models\ResellerInvoice;
use App\Models\ResellerPayment;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class InvoiceService
{
    public function __construct(
        private NotificationService $notificationService,
        private ActivityLogService $activityLogService,
    ) {}

    /**
     * Pay reseller invoice (manual upload).
     */
    public function payInvoice(ResellerInvoice $invoice, User $user, array $data, ?UploadedFile $file = null): ResellerPayment
    {
        return DB::transaction(function () use ($invoice, $user, $data, $file) {
            if ($invoice->status === InvoiceStatus::LUNAS) {
                throw ValidationException::withMessages([
                    'invoice' => ['Tagihan sudah lunas.'],
                ]);
            }

            $amount = $data['amount'];
            $remainingDebt = bcsub((string) $invoice->total_debt, (string) $invoice->paid_amount, 2);

            if (bccomp($amount, $remainingDebt, 2) > 0) {
                throw ValidationException::withMessages([
                    'amount' => ["Jumlah pembayaran melebihi sisa tagihan (Rp {$remainingDebt})."],
                ]);
            }

            $proofPath = null;
            if ($file) {
                $proofPath = $file->store('', 'proofs');
            }

            $payment = ResellerPayment::create([
                'invoice_id' => $invoice->id,
                'user_id' => $user->id,
                'amount' => $amount,
                // Map 'tempo' to 'transfer_manual' for DB compatibility if needed, 
                // or just ensure it matches the migration. 
                // Based on migration: ['transfer_manual', 'midtrans']
                'payment_method' => $data['payment_method'] === 'tempo' ? 'transfer_manual' : $data['payment_method'],

                'proof_image_url' => $proofPath,
                'paid_at' => now(),
                'status' => 'menunggu_verifikasi',
            ]);

            // Tempo reseller: upload bukti tidak boleh langsung membuat invoice LUNAS.
            // Setelah upload, invoice harus menunggu verifikasi admin.
            $invoice->update([
                'status' => InvoiceStatus::MENUNGGU_VERIFIKASI,
            ]);

            return $payment;

        });
    }

    /**
     * Mark overdue invoices. Called by scheduler.
     */
    public function markOverdueInvoices(): int
    {
        $overdueInvoices = ResellerInvoice::where('status', '!=', InvoiceStatus::LUNAS)
            ->where('due_date', '<', now()->toDateString())
            ->where('status', '!=', InvoiceStatus::TERLAMBAT)
            ->get();

        foreach ($overdueInvoices as $invoice) {
            $invoice->update(['status' => InvoiceStatus::TERLAMBAT]);
            $this->notificationService->sendInvoiceOverdue($invoice);
        }

        return $overdueInvoices->count();
    }
}
