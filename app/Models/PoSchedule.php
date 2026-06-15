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

    protected static function boot()
    {
        parent::boot();

        static::saving(function ($schedule) {
            $bookedStock = 0;
            if ($schedule->exists) {
                $bookedStock = $schedule->orderItems()
                    ->whereHas('order', fn($q) => $q->where('order_status', '!=', 'cancelled'))
                    ->sum('qty');
            }

            $maxStock = (int) $schedule->allocated_stock;
            $schedule->remaining_stock = max(0, $maxStock - $bookedStock);

            if ($bookedStock < $maxStock) {
                $schedule->status = PoScheduleStatus::OPEN;
            } else {
                $schedule->status = PoScheduleStatus::FULL;
            }
        });

        static::saved(function ($schedule) {
            $product = $schedule->product;
            if ($product) {
                $isFutureOrToday = $schedule->schedule_date >= now()->startOfDay();
                if ($schedule->status === PoScheduleStatus::OPEN && $schedule->remaining_stock > 0 && $isFutureOrToday) {
                    if ($product->status === 'inactive') {
                        $product->update(['status' => 'active']);
                    }
                }
            }
        });
    }

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
