<?php

namespace App\Enums;

enum City: string
{
    case BANDUNG = 'bandung';
    case CIMAHI = 'cimahi';

    public function label(): string
    {
        return match ($this) {
            self::BANDUNG => 'Bandung',
            self::CIMAHI => 'Cimahi',
        };
    }
}
