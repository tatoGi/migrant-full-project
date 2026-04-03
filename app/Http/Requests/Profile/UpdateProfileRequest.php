<?php

namespace App\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;
use Propaganistas\LaravelPhone\Rules\Phone;

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
            'phone' => ['sometimes', 'nullable', (new Phone)->international()],
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
            'phone.phone' => 'ტელეფონის ნომერი არასწორია (მაგ: +995555123456).',
            'notification_listing_updates.boolean' => 'შეტყობინების ველი უნდა იყოს true ან false.',
            'notification_new_messages.boolean' => 'შეტყობინების ველი უნდა იყოს true ან false.',
            'notification_promotions.boolean' => 'შეტყობინების ველი უნდა იყოს true ან false.',
        ];
    }
}
