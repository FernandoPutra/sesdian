<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class InactivityLogout
{
    const TIMEOUT = 1800;

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (!$user) return $next($request);

        $key        = "last_active_{$user->id}";
        $lastActive = Cache::get($key);

        if ($lastActive && (time() - $lastActive) > self::TIMEOUT) {
            Cache::forget($key);
            $user->tokens()->delete();
            return response()->json(['message' => 'Session expired due to inactivity.'], 401);
        }

        Cache::put($key, time(), self::TIMEOUT + 60);

        return $next($request);
    }
}