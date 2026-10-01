<?php

namespace App\Http\Requests;

class StoreBookRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'pengurus';
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'author' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:100'],
            'year' => ['required', 'integer', 'min:1900', 'max:2099'],
        ];
    }
}
