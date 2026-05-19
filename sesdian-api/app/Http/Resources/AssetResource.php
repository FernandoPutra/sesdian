<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssetResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $totalStock    = $this->stock ?? 0;
        // Hitung stok yang sedang dipinjam (pending+approved+borrowed)
        $borrowedQty   = $this->borrowings()
            ->whereIn('status', ['pending','approved','borrowed'])
            ->sum('quantity');
        $availableStock = max(0, $totalStock);

        return [
            'id'               => $this->id,
            'code'             => $this->code,
            'name'             => $this->name,
            'type'             => $this->type,
            'status'           => $this->status,
            'description'      => $this->description,
            'qr_code'          => $this->qr_code,
            'stock'            => $totalStock,
            'stock_borrowed'   => (int) $borrowedQty,
            'stock_available'  => $availableStock,
            'location'         => $this->location,
            'category'         => $this->category,
            'brand'            => $this->brand,
            'acquisition_year' => $this->acquisition_year,
            'condition'        => $this->condition,
            'ownership'        => $this->ownership,
            'photo'            => $this->photo ? asset('storage/' . $this->photo) : null,
            'is_available'     => $this->isAvailable(),
            'created_at'       => $this->created_at?->toDateTimeString(),
            'updated_at'       => $this->updated_at?->toDateTimeString(),
        ];
    }
}