<?php

namespace App\Models;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'method',
        'payment_status',
        'proof_image_url',
        'gateway_transaction_id',
        'gateway_order_id',
        'gateway_response',
        'amount',
        'paid_at',
        'expired_at',
        'verified_by',
        'verified_at',
    ];

    protected $casts = [
        'method' => PaymentMethod::class,
        'payment_status' => PaymentStatus::class,
        'gateway_response' => 'json',
        'amount' => 'decimal:2',
        'paid_at' => 'datetime',
        'expired_at' => 'datetime',
        'verified_at' => 'datetime',
    ];

    // ──── Relationships ────

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function verifiedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    // ──── Scopes ────

    public function scopePending($query)
    {
        return $query->where('payment_status', PaymentStatus::MENUNGGU_PEMBAYARAN);
    }

    public function scopeAwaitingVerification($query)
    {
        return $query->where('payment_status', PaymentStatus::MENUNGGU_VERIFIKASI);
    }

    public function scopeVerified($query)
    {
        return $query->where('payment_status', PaymentStatus::PEMBAYARAN_BERHASIL);
    }

    public function scopeRejected($query)
    {
        return $query->where('payment_status', PaymentStatus::PEMBAYARAN_DITOLAK);
    }

    // ──── Helpers ────

    public function canTransitionTo(PaymentStatus $newStatus): bool
    {
        return $this->payment_status->canTransitionTo($newStatus);
    }

    public function isManual(): bool
    {
        return $this->method->isManual();
    }

    public function isGateway(): bool
    {
        return $this->method->isGateway();
    }

    public function isTempo(): bool
    {
        return $this->method->isTempo();
    }

    public function isPaid(): bool
    {
        return $this->payment_status === PaymentStatus::PEMBAYARAN_BERHASIL;
    }
}
