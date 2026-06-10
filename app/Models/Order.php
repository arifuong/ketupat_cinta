<?php

namespace App\Models;

use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\ShippingMethod;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_number',
        'user_id',
        'address_id',
        'subtotal_amount',
        'shipping_cost',
        'total_amount',
        'shipping_method',
        'payment_type',
        'order_status',
        'notes',
        'cancel_reason',
        'expired_at',
    ];

    protected $casts = [
        'subtotal_amount' => 'decimal:2',
        'shipping_cost' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'shipping_method' => ShippingMethod::class,
        'payment_type' => PaymentMethod::class,
        'order_status' => OrderStatus::class,
        'expired_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($order) {
            if (empty($order->order_number)) {
                $order->order_number = self::generateOrderNumber();
            }
        });
    }

    // ──── Relationships ────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function address(): BelongsTo
    {
        return $this->belongsTo(UserAddress::class, 'address_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class);
    }

    public function shipment(): HasOne
    {
        return $this->hasOne(Shipment::class);
    }

    public function resellerInvoice(): HasOne
    {
        return $this->hasOne(ResellerInvoice::class);
    }

    // ──── Scopes ────

    public function scopeByStatus($query, OrderStatus $status)
    {
        return $query->where('order_status', $status);
    }

    public function scopeExpired($query)
    {
        return $query->where('order_status', OrderStatus::PENDING_PAYMENT)
                     ->where('expired_at', '<', now());
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    // ──── Helpers ────

    public function canTransitionTo(OrderStatus $newStatus): bool
    {
        return $this->order_status->canTransitionTo($newStatus);
    }

    public function isTempo(): bool
    {
        return $this->payment_type === PaymentMethod::TEMPO;
    }

    public function isExpired(): bool
    {
        return $this->expired_at && $this->expired_at->isPast();
    }

    public static function generateOrderNumber(): string
    {
        $prefix = 'KC';
        $date = now()->format('Ymd');
        $random = strtoupper(substr(uniqid(), -5));
        return "{$prefix}-{$date}-{$random}";
    }
}
