<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();
            $table->foreignId('user_id')->constrained()->onDelete('restrict');
            $table->foreignId('address_id')->constrained('user_addresses')->onDelete('restrict');
            $table->decimal('subtotal_amount', 12, 2);
            $table->decimal('shipping_cost', 10, 2)->default(0);
            $table->decimal('total_amount', 12, 2);
            $table->enum('shipping_method', ['gosend_customer', 'gosend_toko', 'kurir_internal']);
            $table->enum('payment_type', ['transfer_manual', 'qris_manual', 'midtrans', 'tempo']);
            $table->enum('order_status', [
                'pending_payment',
                'waiting_verification',
                'processing',
                'shipped',
                'completed',
                'cancelled',
            ])->default('pending_payment');
            $table->text('notes')->nullable();
            $table->text('cancel_reason')->nullable();
            $table->timestamp('expired_at')->nullable();
            $table->timestamps();

            $table->index('order_number');
            $table->index('user_id');
            $table->index('order_status');
            $table->index('payment_type');
            $table->index('created_at');
            $table->index(['order_status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
