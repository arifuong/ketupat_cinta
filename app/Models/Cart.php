<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Cart extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'product_id',
        'po_schedule_id',
        'qty',
    ];

    protected function casts(): array
    {
        return [
            'qty' => 'integer',
        ];
    }

    // ──── Relationships ────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function poSchedule(): BelongsTo
    {
        return $this->belongsTo(PoSchedule::class);
    }

    // ──── Accessors ────

    public function getSubtotal(?string $role = null): string
    {
        $userRole = $this->user?->role;
        $price = $this->product->getPriceForRole($userRole);
        return bcmul($price, (string) $this->qty, 2);
    }
}
