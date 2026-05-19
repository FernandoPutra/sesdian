<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            $table->string('category')->nullable();
            $table->string('brand')->nullable();
            $table->year('acquisition_year')->nullable();
            $table->enum('condition', ['baik', 'rusak_ringan', 'rusak_berat'])->default('baik');
            $table->enum('ownership', ['BMN', 'Non-BMN'])->default('BMN');
            $table->string('photo')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            $table->dropColumn(['category','brand','acquisition_year','condition','ownership','photo']);
        });
    }
};