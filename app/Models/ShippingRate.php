<?php

namespace App\Models;

use App\Enums\City;
use App\Enums\ShippingMethod;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShippingRate extends Model
{
    use HasFactory;

    protected $fillable = [
        'method',
        'city',
        'cost',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'method' => ShippingMethod::class,
            'city' => City::class,
            'cost' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    // ──── Scopes ────

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForCity($query, City $city)
    {
        return $query->where('city', $city);
    }

    public function scopeForMethod($query, ShippingMethod $method)
    {
        return $query->where('method', $method);
    }

    // ──── Static Helpers ────

    public static function getCost(ShippingMethod $method, City $city): string
    {
        $rate = self::active()->forMethod($method)->forCity($city)->first();
        return $rate ? $rate->cost : (string) $method->getDefaultCost();
    }
}
