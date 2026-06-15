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
        'recipient_name',
        'recipient_phone',
        'province',
        'postal_code',
        'notes',
    ];

    protected $casts = [
        'city' => City::class,
        'is_default' => 'boolean',
    ];

    protected $appends = [
        'maps_link',
    ];

    // Accessor and Mutator for maps_link alias
    public function getMapsLinkAttribute(): ?string
    {
        return $this->map_link;
    }

    public function setMapsLinkAttribute($value)
    {
        $this->attributes['map_link'] = $value;
    }

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
        if ($this->province) {
            $parts[] = $this->province;
        }
        if ($this->postal_code) {
            $parts[] = $this->postal_code;
        }
        return implode(', ', $parts);
    }
}
