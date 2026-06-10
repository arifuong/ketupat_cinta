<?php

namespace App\Enums;

enum PoScheduleStatus: string
{
    case OPEN = 'open';
    case CLOSED = 'closed';
    case FULL = 'full';

    public function label(): string
    {
        return match ($this) {
            self::OPEN => 'Buka',
            self::CLOSED => 'Ditutup',
            self::FULL => 'Kuota PO Penuh',
        };
    }
}
