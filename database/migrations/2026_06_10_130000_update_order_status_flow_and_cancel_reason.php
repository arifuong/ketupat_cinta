<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'cancel_reason')) {
                $table->text('cancel_reason')->nullable()->after('notes');
            }
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE orders MODIFY order_status ENUM('dibuat','sedang_diproses','sedang_disiapkan','sedang_dikirim','pesanan_selesai','dibatalkan','pending_payment','waiting_verification','processing','shipped','completed','cancelled') DEFAULT 'pending_payment'");
        }

        DB::table('orders')->where('order_status', 'dibuat')->update(['order_status' => 'pending_payment']);
        DB::table('orders')->whereIn('order_status', ['sedang_diproses', 'sedang_disiapkan'])->update(['order_status' => 'processing']);
        DB::table('orders')->where('order_status', 'sedang_dikirim')->update(['order_status' => 'shipped']);
        DB::table('orders')->where('order_status', 'pesanan_selesai')->update(['order_status' => 'completed']);
        DB::table('orders')->where('order_status', 'dibatalkan')->update(['order_status' => 'cancelled']);

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE orders MODIFY order_status ENUM('pending_payment','waiting_verification','processing','shipped','completed','cancelled') DEFAULT 'pending_payment'");
        }
    }

    public function down(): void
    {
        DB::table('orders')->where('order_status', 'pending_payment')->update(['order_status' => 'dibuat']);
        DB::table('orders')->where('order_status', 'waiting_verification')->update(['order_status' => 'dibuat']);
        DB::table('orders')->where('order_status', 'processing')->update(['order_status' => 'sedang_diproses']);
        DB::table('orders')->where('order_status', 'shipped')->update(['order_status' => 'sedang_dikirim']);
        DB::table('orders')->where('order_status', 'completed')->update(['order_status' => 'pesanan_selesai']);
        DB::table('orders')->where('order_status', 'cancelled')->update(['order_status' => 'dibatalkan']);

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE orders MODIFY order_status ENUM('dibuat','sedang_diproses','sedang_disiapkan','sedang_dikirim','pesanan_selesai','dibatalkan') DEFAULT 'dibuat'");
        }

        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'cancel_reason')) {
                $table->dropColumn('cancel_reason');
            }
        });
    }
};
