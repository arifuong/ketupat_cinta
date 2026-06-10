<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('po_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->date('schedule_date');
            $table->unsignedInteger('allocated_stock');
            $table->unsignedInteger('remaining_stock');
            $table->enum('status', ['open', 'closed', 'full'])->default('open');
            $table->timestamps();

            $table->unique(['product_id', 'schedule_date']);
            $table->index('schedule_date');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('po_schedules');
    }
};
