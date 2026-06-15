<?php

namespace App\Services;

use App\Models\Order;
use App\Models\ResellerInvoice;
use App\Models\Notification as NotificationModel;
use App\Models\User;
use App\Jobs\SendWhatsAppNotification;

class NotificationService
{
    /**
     * Send notification when order is created.
     */
    public function sendOrderCreated(Order $order): void
    {
        $user = $order->user;

        // Internal notification
        NotificationModel::create([
            'user_id' => $user->id,
            'type' => 'order_created',
            'title' => 'Pesanan Dibuat',
            'message' => "Pesanan #{$order->order_number} berhasil dibuat. Total: Rp " . number_format($order->total_amount, 0, ',', '.'),
            'data' => ['order_id' => $order->id, 'order_number' => $order->order_number],
            'channel' => 'internal',
        ]);

        // WhatsApp notification
        SendWhatsAppNotification::dispatch(
            $user->wa_number,
            'order_created',
            [
                'name' => $user->name,
                'order_number' => $order->order_number,
                'total' => number_format($order->total_amount, 0, ',', '.'),
                'expired_at' => $order->expired_at?->format('d/m/Y H:i') ?? '-',
            ]
        )->onQueue('notifications');
    }

    /**
     * Send notification when payment is successful.
     */
    public function sendPaymentSuccess(Order $order): void
    {
        $user = $order->user;

        NotificationModel::create([
            'user_id' => $user->id,
            'type' => 'payment_success',
            'title' => 'Pembayaran Berhasil',
            'message' => "Pembayaran untuk pesanan #{$order->order_number} telah dikonfirmasi.",
            'data' => ['order_id' => $order->id],
            'channel' => 'internal',
        ]);

        SendWhatsAppNotification::dispatch(
            $user->wa_number,
            'payment_success',
            [
                'name' => $user->name,
                'order_number' => $order->order_number,
            ]
        )->onQueue('notifications');
    }

    /**
     * Send notification for order status updates.
     */
    public function sendOrderStatusUpdate(Order $order): void
    {
        $user = $order->user;
        $template = match ($order->order_status->value) {
            'shipped' => 'order_shipped',
            'completed' => 'order_completed',
            default => null,
        };

        if (!$template) return;

        $data = [
            'name' => $user->name,
            'order_number' => $order->order_number,
        ];

        if ($template === 'order_shipped' && $order->shipment) {
            $data['courier'] = $order->shipment->courier_name ?? '-';
            $data['driver'] = $order->shipment->driver_name ?? '-';
            $data['tracking_link'] = $order->shipment->tracking_link ?? '-';
        }

        NotificationModel::create([
            'user_id' => $user->id,
            'type' => $template,
            'title' => $order->order_status->label(),
            'message' => "Pesanan #{$order->order_number} — {$order->order_status->label()}",
            'data' => ['order_id' => $order->id],
            'channel' => 'internal',
        ]);

        SendWhatsAppNotification::dispatch($user->wa_number, $template, $data)
            ->onQueue('notifications');
    }

    /**
     * Notify admin about new payment proof upload.
     */
    public function sendPaymentUploadedToAdmin(Order $order): void
    {
        $admins = User::admins()->get();

        foreach ($admins as $admin) {
            NotificationModel::create([
                'user_id' => $admin->id,
                'type' => 'payment_uploaded',
                'title' => 'Bukti Pembayaran Baru',
                'message' => "User {$order->user->name} mengunggah bukti pembayaran untuk pesanan #{$order->order_number}.",
                'data' => ['order_id' => $order->id],
                'channel' => 'internal',
            ]);
        }
    }

    /**
     * Send invoice reminder.
     */
    public function sendInvoiceReminder(ResellerInvoice $invoice): void
    {
        SendWhatsAppNotification::dispatch(
            $invoice->user->wa_number,
            'invoice_reminder',
            [
                'name' => $invoice->user->name,
                'invoice_number' => $invoice->invoice_number,
                'amount' => number_format($invoice->remaining_debt, 0, ',', '.'),
                'due_date' => $invoice->due_date->format('d/m/Y'),
            ]
        )->onQueue('notifications');
    }

    /**
     * Send invoice overdue notification (Manual trigger).
     */
    public function sendInvoiceOverdueManual(ResellerInvoice $invoice): void
    {
        $user = $invoice->user;

        NotificationModel::create([
            'user_id' => $user->id,
            'type' => 'invoice_overdue_manual',
            'title' => 'Tagihan Jatuh Tempo',
            'message' => "Tagihan Anda #{$invoice->invoice_number} telah jatuh tempo. Silakan lakukan pembayaran.",
            'data' => ['invoice_id' => $invoice->id, 'invoice_number' => $invoice->invoice_number],
            'channel' => 'internal',
        ]);

        SendWhatsAppNotification::dispatch(
            $user->wa_number,
            'invoice_overdue', // Reuse existing template
            [
                'name' => $user->name,
                'invoice_number' => $invoice->invoice_number,
                'amount' => number_format($invoice->remaining_debt, 0, ',', '.'),
            ]
        )->onQueue('notifications');
    }
}
