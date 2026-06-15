<?php

namespace App\Models;

use App\Enums\ShipmentStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Shipment extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'courier_name',
        'courier_wa',
        'driver_name',
        'vehicle_number',
        'vehicle_plate',
        'delivery_source',
        'tracking_link',
        'tracking_number',
        'status',
        'notes',
        'shipped_at',
        'delivered_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => ShipmentStatus::class,
            'shipped_at' => 'datetime',
            'delivered_at' => 'datetime',
        ];
    }

    // ──── Relationships ────

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
