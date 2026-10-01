<?php

namespace App\Http\Requests;

class RegisterRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'min:3', 'max:50', 'unique:users,username'],
            'nim' => ['required', 'string', 'max:50'],
            'password' => ['required', 'string', 'min:4', 'confirmed'],
        ];
    }
}
