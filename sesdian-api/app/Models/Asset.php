<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Asset extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'code', 'name', 'type', 'status', 'description',
        'qr_code', 'stock', 'location', 'category', 'brand',
        'acquisition_year', 'condition', 'ownership', 'photo',
    ];

    protected $casts = [
        'stock'            => 'integer',
        'acquisition_year' => 'integer',
    ];

    public function scopeVisible($query)
    {
        return $query->where('status', '!=', 'repair');
    }

    public function scopeBmn($query)
    {
        return $query->where('ownership', 'BMN');
    }

    public function scopeNonBmn($query)
    {
        return $query->where('ownership', 'Non-BMN');
    }

    public function borrowings(): HasMany
    {
        return $this->hasMany(Borrowing::class);
    }

    public function activeBorrowing(): HasOne
    {
        return $this->hasOne(Borrowing::class)->whereIn('status', ['approved', 'borrowed']);
    }

    public function isAvailable(): bool
    {
        if ($this->type === 'consumable') {
            return $this->stock > 0 && $this->status !== 'repair';
        }
        return $this->status === 'available';
    }
}