<?php

namespace App\Http\Requests;

class FilterBorrowingsRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'pengurus';
    }

    public function rules(): array
    {
        return [
            'status' => ['sometimes', 'nullable', 'in:Dipinjam,Dikembalikan,ALL'],
            'overdue' => ['sometimes', 'nullable', 'boolean'],
        ];
    }
}
