<?php

namespace App\Enums;

enum ShipmentStatus: string
{
    case PENDING = 'pending';
    case PICKED_UP = 'picked_up';
    case IN_TRANSIT = 'in_transit';
    case DELIVERED = 'delivered';

    public function label(): string
    {
        return match ($this) {
            self::PENDING => 'Menunggu Pickup',
            self::PICKED_UP => 'Sudah Dijemput',
            self::IN_TRANSIT => 'Dalam Perjalanan',
            self::DELIVERED => 'Terkirim',
        };
    }
}
