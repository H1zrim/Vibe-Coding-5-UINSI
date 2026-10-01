<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BorrowingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'book_id' => (string) $this->book_id,
            'user_id' => (int) $this->user_id,
            'borrow_date' => $this->borrow_date?->format('Y-m-d'),
            'due_date' => $this->due_date?->format('Y-m-d'),
            'return_date' => $this->return_date?->format('Y-m-d'),
            'status' => $this->status,
            'is_overdue' => (bool) $this->is_overdue,
            'book' => $this->whenLoaded('book', fn () => $this->book
                ? (new BookResource($this->book))->resolve($request)
                : null),
            'user' => $this->whenLoaded('user', fn () => $this->user ? [
                'id' => (int) $this->user->id,
                'name' => $this->user->name,
                'nim' => $this->user->nim,
            ] : null),
        ];
    }
}
