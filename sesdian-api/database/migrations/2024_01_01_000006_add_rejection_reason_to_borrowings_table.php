<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('borrowings', function (Blueprint $table) {
            $table->text('rejection_reason')->nullable()->after('notes');
            $table->enum('condition_before', ['baik','rusak_ringan','rusak_berat'])->nullable()->after('rejection_reason');
            $table->enum('condition_after',  ['baik','rusak_ringan','rusak_berat'])->nullable()->after('condition_before');
        });
    }

    public function down(): void
    {
        Schema::table('borrowings', function (Blueprint $table) {
            $table->dropColumn(['rejection_reason','condition_before','condition_after']);
        });
    }
};