<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->onDelete('cascade');
            $table->enum('method', ['transfer_manual', 'qris_manual', 'midtrans', 'tempo']);
            $table->enum('payment_status', [
                'menunggu_pembayaran',
                'menunggu_verifikasi',
                'pembayaran_berhasil',
                'pembayaran_ditolak',
            ])->default('menunggu_pembayaran');
            $table->string('proof_image_url')->nullable();
            $table->string('gateway_transaction_id')->nullable();
            $table->string('gateway_order_id')->nullable();
            $table->json('gateway_response')->nullable();
            $table->decimal('amount', 12, 2);
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('expired_at')->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();

            $table->index('order_id');
            $table->index('payment_status');
            $table->index('method');
            $table->index('gateway_transaction_id');
            $table->index('gateway_order_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
