<?php

namespace App\Models;

use App\Enums\UserRole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'image_url',
        'price_normal',
        'price_reseller',
        'min_order_customer',
        'min_order_reseller',
        'stock_po_default',
        'status',
    ];

    protected $casts = [
        'price_normal' => 'decimal:2',
        'price_reseller' => 'decimal:2',
        'min_order_customer' => 'integer',
        'min_order_reseller' => 'integer',
        'stock_po_default' => 'integer',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($product) {
            if (empty($product->slug)) {
                $product->slug = static::uniqueSlug($product->name);
            }
        });

        static::updating(function ($product) {
            if ($product->isDirty('name') && empty($product->slug)) {
                $product->slug = static::uniqueSlug($product->name, $product->id);
            }
        });
    }

    public static function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $baseSlug = Str::slug($name) ?: 'produk';
        $slug = $baseSlug;
        $counter = 2;

        while (static::query()
            ->where('slug', $slug)
            ->when($ignoreId, fn ($query) => $query->whereKeyNot($ignoreId))
            ->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        return $slug;
    }

    // ──── Relationships ────

    public function poSchedules(): HasMany
    {
        return $this->hasMany(PoSchedule::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    // ──── Scopes ────

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    // ──── Accessors ────

    public function getPriceForRole(?UserRole $role = null): string
    {
        if ($role === UserRole::RESELLER) {
            return $this->price_reseller;
        }
        return $this->price_normal;
    }

    public function getMinOrderForRole(?UserRole $role = null): int
    {
        if ($role === UserRole::RESELLER) {
            return $this->min_order_reseller;
        }
        return $this->min_order_customer;
    }
}
