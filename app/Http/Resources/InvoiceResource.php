<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $latestPayment = $this->payments()->orderByDesc('created_at')->first();

        $totalDebt = (float) $this->total_debt;
        $paidAmount = (float) $this->paid_amount;
        $remainingDebt = (float) $this->remaining_debt;
        $installmentCount = (int) $this->installment_count;
        $installmentAmount = (float) $this->installment_amount;

        $tagihanPeriodeIni = min($installmentAmount, $remainingDebt);
        $pastPaidAmount = $this->current_installment * $installmentAmount;
        $sudahDibayarPeriodeIni = max(0.0, $paidAmount - $pastPaidAmount);
        
        if ($sudahDibayarPeriodeIni > $tagihanPeriodeIni) {
            $sudahDibayarPeriodeIni = $tagihanPeriodeIni;
        }

        $sisaTagihanPeriodeIni = max(0.0, $tagihanPeriodeIni - $sudahDibayarPeriodeIni);

        return [
            'id' => $this->id,
            'invoice_number' => $this->invoice_number,
            'user' => new UserResource($this->whenLoaded('user')),
            'reseller_name' => $this->user ? $this->user->name : null,
            'order' => new OrderResource($this->whenLoaded('order')),
            'total_debt' => $this->total_debt,
            'paid_amount' => $this->paid_amount,
            'remaining_debt' => $this->remaining_debt,
            'installment_count' => $this->installment_count,
            'current_installment' => $this->current_installment,
            'installment_amount' => $this->installment_amount,
            'due_date' => $this->due_date->format('Y-m-d'),
            'due_date_formatted' => $this->due_date->translatedFormat('d F Y'),
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'is_overdue' => $this->is_overdue,
            'proof_image_url' => ($latestPayment && $latestPayment->proof_image_url)
                ? asset('storage/proofs/' . $latestPayment->proof_image_url)
                : null,
            'payments' => $this->payments()->orderByDesc('created_at')->get(),
            'tagihan_periode_ini' => $tagihanPeriodeIni,
            'tagihan_periode_ini_formatted' => 'Rp' . number_format($tagihanPeriodeIni, 0, ',', '.'),
            'sudah_dibayar_periode_ini' => $sudahDibayarPeriodeIni,
            'sudah_dibayar_periode_ini_formatted' => 'Rp' . number_format($sudahDibayarPeriodeIni, 0, ',', '.'),
            'sisa_tagihan_periode_ini' => $sisaTagihanPeriodeIni,
            'sisa_tagihan_periode_ini_formatted' => 'Rp' . number_format($sisaTagihanPeriodeIni, 0, ',', '.'),
            
            // Additional required keys for API contract (may be null when not available)
            'rekening_tujuan' => null,
            'nama_bank' => null,
            'nama_pemilik_rekening' => null,
            'created_at' => $this->created_at->toISOString(),
        ];
    }
}
