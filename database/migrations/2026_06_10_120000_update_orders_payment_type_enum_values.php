<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE orders MODIFY payment_type VARCHAR(32) NOT NULL');
        }

        DB::table('orders')->where('payment_type', 'manual')->update(['payment_type' => 'transfer_manual']);
        DB::table('orders')->where('payment_type', 'gateway')->update(['payment_type' => 'midtrans']);

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE orders MODIFY payment_type ENUM('transfer_manual','qris_manual','midtrans','tempo') NOT NULL");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE orders MODIFY payment_type VARCHAR(32) NOT NULL');
        }

        DB::table('orders')->where('payment_type', 'manual')->update(['payment_type' => 'transfer_manual']);
        DB::table('orders')->where('payment_type', 'gateway')->update(['payment_type' => 'midtrans']);

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE orders MODIFY payment_type ENUM('transfer_manual','qris_manual','midtrans','tempo') NOT NULL");
        }
    }
};
