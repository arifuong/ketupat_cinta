<?php

namespace App\Services;

use App\Enums\InvoiceStatus;
use App\Enums\OrderStatus;
use App\Models\ResellerInvoice;
use App\Models\ResellerPayment;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;


class ResellerInvoiceService
{
    public function listInvoices($request)
    {
        $query = ResellerInvoice::with(['user', 'order', 'payments'])
            ->orderByDesc('created_at');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        return $query->paginate(15);
    }

    public function verifyInvoice(int $id, bool $approved, User $admin): ResellerInvoice
    {
        return DB::transaction(function () use ($id, $approved, $admin) {
            $invoice = ResellerInvoice::with(['order', 'payments'])
                ->lockForUpdate()
                ->findOrFail($id);

            // Find the latest payment that needs verification
            $latestPayment = ResellerPayment::where('invoice_id', $invoice->id)
                ->where('status', 'menunggu_verifikasi')
                ->orderByDesc('created_at')
                ->lockForUpdate()
                ->first();

            if (!$latestPayment) {
                throw ValidationException::withMessages([
                    'payment' => ['Tidak ada pembayaran pending yang perlu diverifikasi.'],
                ]);
            }

            if ($approved) {
                // Mark latest reseller payment as verified
                $latestPayment->update([
                    'verified_by' => $admin->id,
                    'verified_at' => now(),
                    'status' => 'disetujui',
                ]);

                // Recalculate paid_amount as the sum of all verified reseller payments
                $newPaidAmount = number_format(ResellerPayment::where('invoice_id', $invoice->id)
                    ->where('status', 'disetujui')
                    ->sum('amount'), 2, '.', '');
                
                // Calculate current installment dynamically
                if ($invoice->installment_amount > 0) {
                    $newCurrentInstallment = (int) min($invoice->installment_count, floor($newPaidAmount / $invoice->installment_amount));
                } else {
                    $newCurrentInstallment = 0;
                }

                $newDueDate = $invoice->created_at->addDays(14 * ($newCurrentInstallment + 1));

                $newIsFullyPaid = bccomp((string) $newPaidAmount, (string) $invoice->total_debt, 2) >= 0;
                
                $hasPending = ResellerPayment::where('invoice_id', $invoice->id)
                    ->where('status', 'menunggu_verifikasi')
                    ->exists();

                if ($newIsFullyPaid) {
                    $newStatus = InvoiceStatus::LUNAS;
                } elseif ($hasPending) {
                    $newStatus = InvoiceStatus::MENUNGGU_VERIFIKASI;
                } elseif (now()->gt($newDueDate)) {
                    $newStatus = InvoiceStatus::TERLAMBAT;
                } else {
                    $newStatus = InvoiceStatus::SEBAGIAN_DIBAYAR;
                }

                $invoice->update([
                    'paid_amount' => $newPaidAmount,
                    'current_installment' => $newCurrentInstallment,
                    'due_date' => $newDueDate,
                    'status' => $newStatus,
                ]);

                // If order exists and not already processing, transition to PROCESSING.
                if ($invoice->order && $invoice->order->order_status !== OrderStatus::PROCESSING && in_array($invoice->order->order_status, [OrderStatus::PENDING_PAYMENT, OrderStatus::WAITING_VERIFICATION])) {
                    $invoice->order->update(['order_status' => OrderStatus::PROCESSING]);
                }

            } else {
                // Reject: keep invoice active (allow re-upload).
                $latestPayment->update([
                    'verified_by' => $admin->id,
                    'verified_at' => now(),
                    'status' => 'ditolak',
                ]);

                // Recalculate paid_amount (excluding rejected)
                $newPaidAmount = number_format(ResellerPayment::where('invoice_id', $invoice->id)
                    ->where('status', 'disetujui')
                    ->sum('amount'), 2, '.', '');

                if ($invoice->installment_amount > 0) {
                    $newCurrentInstallment = (int) min($invoice->installment_count, floor($newPaidAmount / $invoice->installment_amount));
                } else {
                    $newCurrentInstallment = 0;
                }

                $newDueDate = $invoice->created_at->addDays(14 * ($newCurrentInstallment + 1));

                $newIsFullyPaid = bccomp((string) $newPaidAmount, (string) $invoice->total_debt, 2) >= 0;

                $hasPending = ResellerPayment::where('invoice_id', $invoice->id)
                    ->where('status', 'menunggu_verifikasi')
                    ->exists();

                if ($newIsFullyPaid) {
                    $newStatus = InvoiceStatus::LUNAS;
                } elseif ($hasPending) {
                    $newStatus = InvoiceStatus::MENUNGGU_VERIFIKASI;
                } elseif (now()->gt($newDueDate)) {
                    $newStatus = InvoiceStatus::TERLAMBAT;
                } elseif (bccomp((string) $newPaidAmount, '0', 2) > 0) {
                    $newStatus = InvoiceStatus::SEBAGIAN_DIBAYAR;
                } else {
                    $newStatus = InvoiceStatus::MENUNGGU_PEMBAYARAN;
                }

                $invoice->update([
                    'paid_amount' => $newPaidAmount,
                    'current_installment' => $newCurrentInstallment,
                    'due_date' => $newDueDate,
                    'status' => $newStatus,
                ]);
            }

            return $invoice->fresh(['user', 'order', 'payments']);
        });
    }

    public function remindInvoice(ResellerInvoice $invoice): void
    {
        // Use NotificationService to send reminder
        app(NotificationService::class)->sendInvoiceOverdueManual($invoice);
    }
}

