<?php

namespace App\Services;

use App\Models\WaLog;
use Illuminate\Support\Facades\Http;

class WhatsAppService
{
    public function send(
        string $phone,
        string $message,
        ?int   $borrowingId,
        string $trigger
    ): void {
        $status   = 'failed';
        $response = null;

        try {
            $res = Http::withHeaders([
                'Authorization' => env('WA_TOKEN'),
            ])->post(env('WA_API_URL'), [
                'target'  => $phone,
                'message' => $message,
            ]);

            $status   = $res->successful() ? 'success' : 'failed';
            $response = $res->body();
        } catch (\Throwable $e) {
            $response = $e->getMessage();
        }

        WaLog::create([
            'borrowing_id' => $borrowingId,
            'recipient'    => $phone,
            'message'      => $message,
            'status'       => $status,
            'response'     => $response,
            'triggered_by' => $trigger,
            'sent_at'      => now(),
        ]);
    }
}