<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssetResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'code'        => $this->code,
            'name'        => $this->name,
            'type'        => $this->type,
            'status'      => $this->status,
            'description' => $this->description,
            'qr_code'     => $this->qr_code,
            'stock'       => $this->type === 'consumable' ? $this->stock : null,
            'location'    => $this->location,
            'is_available'=> $this->isAvailable(),
            'created_at'  => $this->created_at?->toDateTimeString(),
            'updated_at'  => $this->updated_at?->toDateTimeString(),
        ];
    }
}