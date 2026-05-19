<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditTrail extends Model
{
    use HasFactory;

    public $timestamps  = false;
    const UPDATED_AT    = null;

    protected $fillable = [
        'user_id',
        'action',
        'model',
        'model_id',
        'old_values',
        'new_values',
        'ip_address',
        'created_at',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'created_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public static function log(
        ?int    $userId,
        string  $action,
        string  $model,
        ?int    $modelId    = null,
        ?array  $oldValues  = null,
        ?array  $newValues  = null,
        ?string $ip         = null
    ): void {
        static::create([
            'user_id'    => $userId,
            'action'     => $action,
            'model'      => $model,
            'model_id'   => $modelId,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => $ip,
            'created_at' => now(),
        ]);
    }
}