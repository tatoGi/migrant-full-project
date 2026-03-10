<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'role' => ['required', 'string', 'in:client,provider'],
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
            'password.confirmed' => 'პაროლები არ ემთხვევა.',
            'role.required' => 'როლი სავალდებულოა.',
            'role.in' => 'როლი უნდა იყოს: client ან provider.',
        ];
    }
}
