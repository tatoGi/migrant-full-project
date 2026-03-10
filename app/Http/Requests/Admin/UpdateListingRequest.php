<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateListingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('admin');
    }

    public function rules(): array
    {
        return [
            'provider_name' => ['sometimes', 'string', 'max:255'],
            'phone' => ['sometimes', 'string', 'max:50'],
            'email' => ['sometimes', 'nullable', 'email'],
            'profession' => ['sometimes', 'string', 'max:100'],
            'country' => ['sometimes', 'string', 'max:100'],
            'city' => ['sometimes', 'string', 'max:100'],
            'description' => ['sometimes', 'string', 'min:20'],
            'listing_type' => ['sometimes', 'in:standard,vip'],
            'price_type' => ['sometimes', 'in:fixed,hourly,negotiable'],
            'price_value' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'status' => ['sometimes', 'in:active,inactive'],
        ];
    }

    public function messages(): array
    {
        return [
            'listing_type.in' => 'განცხადების ტიპი: standard ან vip.',
            'price_type.in' => 'ფასის ტიპი: fixed, hourly ან negotiable.',
            'status.in' => 'სტატუსი: active ან inactive.',
            'description.min' => 'აღწერა მინიმუმ 20 სიმბოლო.',
        ];
    }
}
