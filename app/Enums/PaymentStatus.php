<?php

namespace App\Enums;

enum PaymentStatus: string
{
    case MENUNGGU_PEMBAYARAN = 'menunggu_pembayaran';
    case MENUNGGU_VERIFIKASI = 'menunggu_verifikasi';
    case PEMBAYARAN_BERHASIL = 'pembayaran_berhasil';
    case PEMBAYARAN_DITOLAK = 'pembayaran_ditolak';

    public function label(): string
    {
        return match ($this) {
            self::MENUNGGU_PEMBAYARAN => 'Menunggu Pembayaran',
            self::MENUNGGU_VERIFIKASI => 'Menunggu Verifikasi',
            self::PEMBAYARAN_BERHASIL => 'Pembayaran Berhasil',
            self::PEMBAYARAN_DITOLAK => 'Pembayaran Ditolak',
        };
    }

    public function allowedTransitions(): array
    {
        return match ($this) {
            self::MENUNGGU_PEMBAYARAN => [self::MENUNGGU_VERIFIKASI, self::PEMBAYARAN_BERHASIL],
            self::MENUNGGU_VERIFIKASI => [self::PEMBAYARAN_BERHASIL, self::PEMBAYARAN_DITOLAK],
            self::PEMBAYARAN_BERHASIL => [],
            self::PEMBAYARAN_DITOLAK => [self::MENUNGGU_PEMBAYARAN],
        };
    }

    public function canTransitionTo(self $newStatus): bool
    {
        return in_array($newStatus, $this->allowedTransitions());
    }
}
