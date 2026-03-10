<?php

namespace App\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'first_name' => ['sometimes', 'string', 'max:100'],
            'last_name' => ['sometimes', 'string', 'max:100'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:50'],
            'country' => ['sometimes', 'nullable', 'string', 'max:100'],
            'city' => ['sometimes', 'nullable', 'string', 'max:100'],
            'nationality' => ['sometimes', 'nullable', 'string', 'max:100'],
            'languages' => ['sometimes', 'nullable', 'array'],
            'languages.*' => ['string'],
            'notification_listing_updates' => ['sometimes', 'boolean'],
            'notification_new_messages' => ['sometimes', 'boolean'],
            'notification_promotions' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'first_name.max' => 'სახელი მაქსიმუმ 100 სიმბოლო.',
            'last_name.max' => 'გვარი მაქსიმუმ 100 სიმბოლო.',
            'phone.max' => 'ტელეფონი მაქსიმუმ 50 სიმბოლო.',
            'notification_listing_updates.boolean' => 'შეტყობინების ველი უნდა იყოს true ან false.',
            'notification_new_messages.boolean' => 'შეტყობინების ველი უნდა იყოს true ან false.',
            'notification_promotions.boolean' => 'შეტყობინების ველი უნდა იყოს true ან false.',
        ];
    }
}
