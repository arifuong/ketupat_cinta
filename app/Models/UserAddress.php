<?php

namespace App\Models;

use App\Enums\City;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UserAddress extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'label',
        'detail',
        'city',
        'district',
        'map_link',
        'is_default',
    ];

    protected $casts = [
        'city' => City::class,
        'is_default' => 'boolean',
    ];

    // ──── Relationships ────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'address_id');
    }

    // ──── Helpers ────

    public function getFullAddress(): string
    {
        $parts = [$this->detail];
        if ($this->district) {
            $parts[] = $this->district;
        }
        $parts[] = $this->city->label();
        return implode(', ', $parts);
    }
}
