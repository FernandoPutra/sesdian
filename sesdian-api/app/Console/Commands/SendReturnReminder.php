<?php

namespace App\Console\Commands;

use App\Models\Borrowing;
use App\Services\WhatsAppService;
use Illuminate\Console\Command;

class SendReturnReminder extends Command
{
    protected $signature   = 'borrowings:remind-return';
    protected $description = 'Send WA reminder H-1 before return due date';

    public function handle(WhatsAppService $wa): void
    {
        $tomorrow = now()->addDay()->toDateString();

        Borrowing::with(['user', 'asset'])
            ->where('status', Borrowing::STATUS_BORROWED)
            ->whereDate('return_due', $tomorrow)
            ->each(function (Borrowing $b) use ($wa): void {
                $wa->send(
                    $b->user->phone,
                    "⏰ Pengingat: Pengembalian *{$b->asset->name}* jatuh tempo besok ({$b->return_due}). Harap kembalikan tepat waktu.",
                    $b->id,
                    'return_reminder'
                );
            });
    }
}