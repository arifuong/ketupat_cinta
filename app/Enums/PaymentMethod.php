<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case TRANSFER_MANUAL = 'transfer_manual';
    case QRIS_MANUAL = 'qris_manual';
    case MIDTRANS = 'midtrans';
    case TEMPO = 'tempo';

    public function label(): string
    {
        return match ($this) {
            self::TRANSFER_MANUAL => 'Transfer Bank (Manual)',
            self::QRIS_MANUAL => 'QRIS (Manual)',
            self::MIDTRANS => 'Payment Gateway (Midtrans)',
            self::TEMPO => 'Bayar Tempo',
        };
    }

    public function isManual(): bool
    {
        return in_array($this, [self::TRANSFER_MANUAL, self::QRIS_MANUAL]);
    }

    public function isGateway(): bool
    {
        return $this === self::MIDTRANS;
    }

    public function isTempo(): bool
    {
        return $this === self::TEMPO;
    }
}
