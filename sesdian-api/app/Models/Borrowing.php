<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Borrowing extends Model
{
    use HasFactory;

    const STATUS_PENDING  = 'pending';
    const STATUS_APPROVED = 'approved';
    const STATUS_BORROWED = 'borrowed';
    const STATUS_RETURNED = 'returned';
    const STATUS_REJECTED = 'rejected';

    protected $fillable = [
    'user_id', 'asset_id', 'quantity', 'status',
    'requested_at', 'approved_at', 'borrowed_at',
    'return_due', 'returned_at', 'approved_by', 'notes',
    'rejection_reason', 'condition_before', 'condition_after',
];

    protected $casts = [
        'requested_at' => 'datetime',
        'approved_at'  => 'datetime',
        'borrowed_at'  => 'datetime',
        'returned_at'  => 'datetime',
        'return_due'   => 'date',
    ];

    public function user(): BelongsTo     { return $this->belongsTo(User::class); }
    public function asset(): BelongsTo    { return $this->belongsTo(Asset::class); }
    public function approvedBy(): BelongsTo { return $this->belongsTo(User::class, 'approved_by'); }
    public function waLogs(): HasMany     { return $this->hasMany(WaLog::class); }

    public function isOverdue(): bool
    {
        return $this->status === self::STATUS_BORROWED && now()->gt($this->return_due);
    }
}