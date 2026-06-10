<?php

namespace App\Enums;

enum ShippingMethod: string
{
    case GOSEND_CUSTOMER = 'gosend_customer';
    case GOSEND_TOKO = 'gosend_toko';
    case KURIR_INTERNAL = 'kurir_internal';

    public function label(): string
    {
        return match ($this) {
            self::GOSEND_CUSTOMER => 'GoSend (Customer Driver)',
            self::GOSEND_TOKO => 'GoSend (Toko Driver)',
            self::KURIR_INTERNAL => 'Kurir Internal',
        };
    }

    public function getDefaultCost(): int
    {
        return match ($this) {
            self::GOSEND_CUSTOMER => (int) config('shipping.methods.gosend_customer.default_cost', 15000),
            self::GOSEND_TOKO => (int) config('shipping.methods.gosend_toko.default_cost', 10000),
            self::KURIR_INTERNAL => (int) config('shipping.methods.kurir_internal.default_cost', 0),
        };
    }
}
