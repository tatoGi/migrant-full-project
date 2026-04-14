<?php

namespace App\Http\Requests\Listing;

use Illuminate\Foundation\Http\FormRequest;

class UpdateListingRequest extends FormRequest
{
    public function authorize(): bool
    {
        $listing = $this->route('listing');

        return $this->user()->hasRole('provider') && $listing->user_id === $this->user()->id;
    }

    public function rules(): array
    {
        return [
            'provider_name' => ['sometimes', 'string', 'max:255'],
            'phone' => ['sometimes', 'string', 'max:50'],
            'email' => ['sometimes', 'nullable', 'email'],
            'nationality' => ['sometimes', 'string', 'max:100'],
            'languages' => ['sometimes', 'array', 'min:1'],
            'languages.*' => ['string'],
            'profession' => ['sometimes', 'string', 'max:100'],
            'country' => ['sometimes', 'string', 'max:100'],
            'city' => ['sometimes', 'array', 'min:1'],
            'city.*' => ['string', 'max:100'],
            'description' => ['sometimes', 'string', 'min:20'],
            'listing_type' => ['sometimes', 'in:standard,vip'],
            'price_type' => ['sometimes', 'in:fixed,hourly,negotiable'],
            'price_value' => ['nullable', 'numeric', 'min:0'],
            'photos' => ['sometimes', 'nullable', 'array'],
            'photos.*' => ['string'],
            'booking_mode' => ['sometimes', 'in:request,calendar'],
            'status' => ['sometimes', 'in:active,inactive'],
        ];
    }

    public function messages(): array
    {
        return [
            'description.min' => 'აღწერა მინიმუმ 20 სიმბოლო უნდა იყოს.',
            'price_value.min' => 'ფასი არ შეიძლება იყოს 0-ზე ნაკლები.',
            'listing_type.in' => 'განცხადების ტიპი: standard ან vip.',
            'price_type.in' => 'ფასის ტიპი: fixed, hourly ან negotiable.',
            'status.in' => 'სტატუსი: active ან inactive.',
        ];
    }
}
