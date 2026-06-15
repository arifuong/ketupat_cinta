<?php

namespace App\Enums;

enum InvoiceStatus: string
{
    case BELUM_DITAGIH = 'belum_ditagih';
    case MENUNGGU_PEMBAYARAN = 'menunggu_pembayaran';
    case MENUNGGU_VERIFIKASI = 'menunggu_verifikasi';
    case SEBAGIAN_DIBAYAR = 'sebagian_dibayar';
    case TERLAMBAT = 'terlambat';
    case LUNAS = 'lunas';

    public function label(): string
    {
        return match ($this) {
            self::BELUM_DITAGIH => 'Invoice Dibuat',
            self::MENUNGGU_PEMBAYARAN => 'Menunggu Pembayaran',
            self::MENUNGGU_VERIFIKASI => 'Menunggu Verifikasi',
            self::SEBAGIAN_DIBAYAR => 'Sebagian Dibayar',
            self::TERLAMBAT => 'Terlambat',
            self::LUNAS => 'Lunas',
        };
    }
}
