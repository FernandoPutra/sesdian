<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            $table->string('category')->nullable()->after('location');
            $table->string('brand')->nullable()->after('category');
            $table->year('acquisition_year')->nullable()->after('brand');
            $table->enum('condition', ['baik', 'rusak_ringan', 'rusak_berat'])->default('baik')->after('acquisition_year');
            $table->enum('ownership', ['BMN', 'Non-BMN'])->default('BMN')->after('condition');
            $table->string('photo')->nullable()->after('ownership');
        });
    }

    public function down(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            $table->dropColumn(['category','brand','acquisition_year','condition','ownership','photo']);
        });
    }
};