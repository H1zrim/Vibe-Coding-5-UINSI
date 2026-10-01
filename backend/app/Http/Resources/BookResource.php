<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BookResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'title' => $this->title,
            'author' => $this->author,
            'category' => $this->category,
            'year' => (int) $this->year,
            'status' => $this->status,
        ];
    }
}
