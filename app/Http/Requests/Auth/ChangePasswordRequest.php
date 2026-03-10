<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class ChangePasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ];
    }

    public function messages(): array
    {
        return [
            'password.required' => 'პაროლი სავალდებულოა.',
            'password.min' => 'პაროლი მინიმუმ 6 სიმბოლო უნდა იყოს.',
            'password.confirmed' => 'პაროლები არ ემთხვევა.',
        ];
    }
}
