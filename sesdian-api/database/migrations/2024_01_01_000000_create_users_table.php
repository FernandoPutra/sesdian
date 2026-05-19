<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('nip', 20)->unique();
            $table->string('email')->unique();
            $table->string('password');
            $table->enum('role', ['guest', 'user', 'admin'])->default('user');
            $table->string('phone', 20)->nullable();
            $table->timestamp('last_active')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};