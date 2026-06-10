<?php

namespace App\Enums;

enum InvoiceStatus: string
{
    case BELUM_DITAGIH = 'belum_ditagih';
    case MENUNGGU_PEMBAYARAN = 'menunggu_pembayaran';
    case TERLAMBAT = 'terlambat';
    case LUNAS = 'lunas';

    public function label(): string
    {
        return match ($this) {
            self::BELUM_DITAGIH => 'Belum Ditagih',
            self::MENUNGGU_PEMBAYARAN => 'Menunggu Pembayaran',
            self::TERLAMBAT => 'Terlambat',
            self::LUNAS => 'Lunas',
        };
    }
}
