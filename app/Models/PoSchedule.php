<?php

namespace App\Models;

use App\Enums\PoScheduleStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PoSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'schedule_date',
        'allocated_stock',
        'remaining_stock',
        'status',
    ];

    protected $casts = [
        'schedule_date' => 'date',
        'allocated_stock' => 'integer',
        'remaining_stock' => 'integer',
        'status' => PoScheduleStatus::class,
    ];

    // ──── Relationships ────

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    // ──── Scopes ────

    public function scopeAvailable($query)
    {
        return $query->where('status', PoScheduleStatus::OPEN)
                     ->where('remaining_stock', '>', 0)
                     ->where('schedule_date', '>=', now()->toDateString());
    }

    public function scopeByDate($query, string $date)
    {
        return $query->where('schedule_date', $date);
    }

    public function scopeUpcoming($query)
    {
        return $query->where('schedule_date', '>=', now()->toDateString())
                     ->orderBy('schedule_date');
    }

    // ──── Helpers ────

    public function hasStock(int $qty = 1): bool
    {
        return $this->remaining_stock >= $qty;
    }

    public function decrementStock(int $qty): void
    {
        $this->decrement('remaining_stock', $qty);

        if ($this->fresh()->remaining_stock <= 0) {
            $this->update(['status' => PoScheduleStatus::FULL]);
        }
    }

    public function incrementStock(int $qty): void
    {
        $this->increment('remaining_stock', $qty);

        if ($this->status === PoScheduleStatus::FULL && $this->fresh()->remaining_stock > 0) {
            $this->update(['status' => PoScheduleStatus::OPEN]);
        }
    }
}
