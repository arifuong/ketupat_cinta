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
                'payment_method' => $data['payment_method'] ?? 'transfer_manual',
                'proof_image_url' => $proofPath,
                'paid_at' => now(),
            ]);

            // Update invoice paid amount
            $newPaidAmount = bcadd((string) $invoice->paid_amount, $amount, 2);
            $invoice->update(['paid_amount' => $newPaidAmount]);

            // Check if fully paid
            if (bccomp($newPaidAmount, (string) $invoice->total_debt, 2) >= 0) {
                $invoice->update(['status' => InvoiceStatus::LUNAS]);
            }

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
