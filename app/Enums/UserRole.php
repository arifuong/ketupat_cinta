<?php

namespace App\Enums;

enum UserRole: string
{
    case CUSTOMER = 'customer';
    case RESELLER = 'reseller';
    case ADMIN = 'admin';

    public function label(): string
    {
        return match ($this) {
            self::CUSTOMER => 'Customer',
            self::RESELLER => 'Reseller',
            self::ADMIN => 'Admin',
        };
    }
}
