<?php

namespace App\Enums;

enum OrderStatus: string
{
    case PENDING_PAYMENT = 'pending_payment';
    case WAITING_VERIFICATION = 'waiting_verification';
    case PROCESSING = 'processing';
    case SHIPPED = 'shipped';
    case COMPLETED = 'completed';
    case CANCELLED = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::PENDING_PAYMENT => 'Menunggu Pembayaran',
            self::WAITING_VERIFICATION => 'Menunggu Verifikasi',
            self::PROCESSING => 'Sedang Diproses',
            self::SHIPPED => 'Dikirim',
            self::COMPLETED => 'Selesai',
            self::CANCELLED => 'Dibatalkan',
        };
    }

    /**
     * Get allowed transitions from current status.
     */
    public function allowedTransitions(): array
    {
        return match ($this) {
            self::PENDING_PAYMENT => [self::WAITING_VERIFICATION, self::PROCESSING, self::CANCELLED],
            self::WAITING_VERIFICATION => [self::PROCESSING, self::CANCELLED],
            self::PROCESSING => [self::SHIPPED],
            self::SHIPPED => [self::COMPLETED],
            self::COMPLETED => [],
            self::CANCELLED => [],
        };
    }

    public function canTransitionTo(self $newStatus): bool
    {
        return in_array($newStatus, $this->allowedTransitions());
    }

    /**
     * Statuses that should trigger WhatsApp notification.
     */
    public function shouldNotifyWhatsApp(): bool
    {
        return in_array($this, [
            self::SHIPPED,
            self::COMPLETED,
        ]);
    }
}
