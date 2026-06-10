<?php

namespace App\Models;

use App\Enums\InvoiceStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ResellerInvoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_number',
        'user_id',
        'order_id',
        'total_debt',
        'paid_amount',
        'due_date',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'total_debt' => 'decimal:2',
            'paid_amount' => 'decimal:2',
            'due_date' => 'date',
            'status' => InvoiceStatus::class,
        ];
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($invoice) {
            if (empty($invoice->invoice_number)) {
                $invoice->invoice_number = self::generateInvoiceNumber();
            }
        });
    }

    // ──── Relationships ────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(ResellerPayment::class, 'invoice_id');
    }

    // ──── Scopes ────

    public function scopeOverdue($query)
    {
        return $query->where('status', '!=', InvoiceStatus::LUNAS)
                     ->where('due_date', '<', now()->toDateString());
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeUnpaid($query)
    {
        return $query->whereIn('status', [
            InvoiceStatus::BELUM_DITAGIH,
            InvoiceStatus::MENUNGGU_PEMBAYARAN,
            InvoiceStatus::TERLAMBAT,
        ]);
    }

    // ──── Accessors ────

    public function getRemainingDebtAttribute(): string
    {
        return bcsub((string) $this->total_debt, (string) $this->paid_amount, 2);
    }

    public function getIsOverdueAttribute(): bool
    {
        return $this->due_date->isPast() && $this->status !== InvoiceStatus::LUNAS;
    }

    public function getIsFullyPaidAttribute(): bool
    {
        return bccomp((string) $this->paid_amount, (string) $this->total_debt, 2) >= 0;
    }

    // ──── Helpers ────

    public static function generateInvoiceNumber(): string
    {
        $prefix = 'INV';
        $date = now()->format('Ymd');
        $random = strtoupper(substr(uniqid(), -5));
        return "{$prefix}-{$date}-{$random}";
    }
}
