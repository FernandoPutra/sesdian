<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('wa_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('borrowing_id')->nullable()->constrained()->nullOnDelete();
            $table->string('recipient', 20);
            $table->text('message');
            $table->enum('status', ['success', 'failed']);
            $table->text('response')->nullable();
            $table->enum('triggered_by', ['approval', 'checkin', 'return_reminder', 'returned']);
            $table->timestamp('sent_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wa_logs');
    }
};