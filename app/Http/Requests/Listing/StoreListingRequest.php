<?php

namespace App\Http\Requests\Listing;

use Illuminate\Foundation\Http\FormRequest;
use Propaganistas\LaravelPhone\Rules\Phone;

class StoreListingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('provider');
    }

    public function rules(): array
    {
        return [
            // Step 1 — Basic Info
            'provider_name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', (new Phone)->international()],
            'nationality' => ['required', 'string', 'max:100'],
            'languages' => ['required', 'array', 'min:1'],
            'languages.*' => ['string'],

            // Step 2 — Service Details
            'profession' => ['required', 'string', 'max:100'],
            'country' => ['required', 'string', 'max:100'],
            'city' => ['required', 'array', 'min:1'],
            'city.*' => ['string', 'max:100'],
            'description' => ['required', 'string', 'min:20'],
            'listing_type' => ['required', 'in:standard,vip'],

            // Step 3 — Price & Photos
            // photos = temp token UUID-ების array (POST /api/uploads/temp-დან)
            'price_type' => ['required', 'in:fixed,hourly,negotiable'],
            'price_value' => ['nullable', 'numeric', 'min:0', 'required_unless:price_type,negotiable'],
            'photos' => ['nullable', 'array', 'max:10'],
            'photos.*' => ['string', 'uuid'],

            // Optional
            'email' => ['nullable', 'email'],
            'booking_mode' => ['nullable', 'in:request,calendar'],
        ];
    }

    public function messages(): array
    {
        return [
            'provider_name.required' => 'სახელი სავალდებულოა.',
            'phone.required' => 'ტელეფონი სავალდებულოა.',
            'phone.phone' => 'ტელეფონის ნომერი არასწორია (მაგ: +995555123456).',
            'nationality.required' => 'ეროვნება სავალდებულოა.',
            'languages.required' => 'მინიმუმ ერთი ენა სავალდებულოა.',
            'languages.min' => 'მინიმუმ ერთი ენა სავალდებულოა.',
            'profession.required' => 'პროფესია სავალდებულოა.',
            'country.required' => 'ქვეყანა სავალდებულოა.',
            'city.required' => 'მინიმუმ ერთი ქალაქი სავალდებულოა.',
            'city.min' => 'მინიმუმ ერთი ქალაქი სავალდებულოა.',
            'description.required' => 'აღწერა სავალდებულოა.',
            'description.min' => 'აღწერა მინიმუმ 20 სიმბოლო უნდა იყოს.',
            'listing_type.required' => 'განცხადების ტიპი სავალდებულოა.',
            'listing_type.in' => 'განცხადების ტიპი: standard ან vip.',
            'price_type.required' => 'ფასის ტიპი სავალდებულოა.',
            'price_type.in' => 'ფასის ტიპი: fixed, hourly ან negotiable.',
            'price_value.required_unless' => 'ფასი სავალდებულოა, თუ ტიპი არ არის "შესათანხმებელი".',
            'price_value.min' => 'ფასი არ შეიძლება იყოს 0-ზე ნაკლები.',
        ];
    }
}
