<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
|--------------------------------------------------------------------------
| Scheduled Tasks — Ketupat Cinta
|--------------------------------------------------------------------------
*/

// Cancel expired unpaid orders (runs every 30 minutes)
Schedule::call(function () {
    $service = app(\App\Services\OrderService::class);
    $count = $service->cancelExpiredOrders();
    logger("Cancelled {$count} expired orders.");
})->everyThirtyMinutes()->name('cancel-expired-orders');

// Mark overdue reseller invoices (runs daily at 8 AM)
Schedule::call(function () {
    $service = app(\App\Services\InvoiceService::class);
    $count = $service->markOverdueInvoices();
    logger("Marked {$count} invoices as overdue.");
})->dailyAt('08:00')->name('mark-overdue-invoices');

// Cleanup old activity logs (older than 90 days) — runs weekly
Schedule::call(function () {
    $deleted = \App\Models\ActivityLog::where('created_at', '<', now()->subDays(90))->delete();
    logger("Cleaned up {$deleted} old activity logs.");
})->weekly()->name('cleanup-activity-logs');
