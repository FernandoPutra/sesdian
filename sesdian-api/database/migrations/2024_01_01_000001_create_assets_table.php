<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('assets', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('name');
            $table->enum('type', ['consumable', 'fixed']);
            $table->enum('status', ['available', 'borrowed', 'repair', 'reserved'])->default('available');
            $table->text('description')->nullable();
            $table->string('qr_code')->nullable();
            $table->integer('stock')->default(1);
            $table->string('location')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assets');
    }
};