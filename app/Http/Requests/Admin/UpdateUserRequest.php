<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('admin');
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', Rule::unique('users', 'email')->ignore($this->route('id'))],
            'password' => ['sometimes', 'nullable', 'string', 'min:8'],
            'role' => ['sometimes', Rule::in(['client', 'provider', 'admin'])],
        ];
    }

    public function messages(): array
    {
        return [
            'email.email' => 'ელ-ფოსტის ფორმატი არასწორია.',
            'email.unique' => 'ეს ელ-ფოსტა უკვე რეგისტრირებულია.',
            'password.min' => 'პაროლი მინიმუმ 8 სიმბოლო უნდა იყოს.',
            'role.in' => 'როლი: client, provider ან admin.',
        ];
    }
}
