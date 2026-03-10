<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class AdminReplyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('admin');
    }

    public function rules(): array
    {
        return [
            'conversation_id' => ['required', 'string'],
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'message' => ['required', 'string', 'min:1'],
        ];
    }

    public function messages(): array
    {
        return [
            'conversation_id.required' => 'Conversation ID სავალდებულოა.',
            'user_id.required' => 'მომხმარებელი სავალდებულოა.',
            'user_id.exists' => 'მომხმარებელი ვერ მოიძებნა.',
            'message.required' => 'შეტყობინება სავალდებულოა.',
        ];
    }
}
