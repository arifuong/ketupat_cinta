<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('reseller_invoices', function (Blueprint $table) {
            $table->integer('installment_count')->default(1)->after('total_debt');
            $table->integer('current_installment')->default(0)->after('installment_count');
            $table->decimal('installment_amount', 12, 2)->nullable()->after('current_installment');
        });

        // Update enum status - using raw SQL for compatibility with MySQL enum updates
        DB::statement("ALTER TABLE reseller_invoices MODIFY COLUMN status ENUM('belum_ditagih', 'menunggu_pembayaran', 'menunggu_verifikasi', 'sebagian_dibayar', 'terlambat', 'lunas') DEFAULT 'belum_ditagih'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reseller_invoices', function (Blueprint $table) {
            $table->dropColumn(['installment_count', 'current_installment', 'installment_amount']);
        });

        DB::statement("ALTER TABLE reseller_invoices MODIFY COLUMN status ENUM('belum_ditagih', 'menunggu_pembayaran', 'terlambat', 'lunas') DEFAULT 'belum_ditagih'");
    }
};
