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
        Schema::table('user_addresses', function (Blueprint $table) {
            $table->string('recipient_name')->nullable()->after('user_id');
            $table->string('recipient_phone')->nullable()->after('recipient_name');
            $table->string('province')->nullable()->after('district');
            $table->string('postal_code')->nullable()->after('province');
            $table->text('notes')->nullable()->after('map_link');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_addresses', function (Blueprint $table) {
            $table->dropColumn(['recipient_name', 'recipient_phone', 'province', 'postal_code', 'notes']);
        });
    }
};
