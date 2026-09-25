<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('admin');
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', Rule::in(['client', 'provider', 'admin'])],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'სახელი სავალდებულოა.',
            'email.required' => 'ელ-ფოსტა სავალდებულოა.',
            'email.email' => 'ელ-ფოსტის ფორმატი არასწორია.',
            'email.unique' => 'ეს ელ-ფოსტა უკვე რეგისტრირებულია.',
            'password.required' => 'პაროლი სავალდებულოა.',
            'password.min' => 'პაროლი მინიმუმ 8 სიმბოლო უნდა იყოს.',
            'role.required' => 'როლი სავალდებულოა.',
            'role.in' => 'როლი: client, provider ან admin.',
        ];
    }
}
