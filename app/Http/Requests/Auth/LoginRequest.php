<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.required' => 'ელ-ფოსტა სავალდებულოა.',
            'email.email' => 'ელ-ფოსტის ფორმატი არასწორია.',
            'password.required' => 'პაროლი სავალდებულოა.',
        ];
    }
}
