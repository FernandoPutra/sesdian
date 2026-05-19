<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BorrowingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'status'            => $this->status,
            'return_due'        => $this->return_due?->toDateString(),
            'is_overdue'        => $this->isOverdue(),
            'requested_at'      => $this->requested_at?->toDateTimeString(),
            'approved_at'       => $this->approved_at?->toDateTimeString(),
            'borrowed_at'       => $this->borrowed_at?->toDateTimeString(),
            'returned_at'       => $this->returned_at?->toDateTimeString(),
            'notes'             => $this->notes,
            'rejection_reason'  => $this->rejection_reason,
            'condition_before'  => $this->condition_before,
            'condition_after'   => $this->condition_after,
            'created_at'        => $this->created_at?->toDateTimeString(),
            'user' => [
                'id'    => $this->user?->id,
                'name'  => $this->user?->name,
                'nip'   => $this->user?->nip,
                'phone' => $this->user?->phone,
            ],
            'asset'      => new AssetResource($this->whenLoaded('asset')),
            'approved_by'=> $this->approvedBy?->name,
        ];
    }
}