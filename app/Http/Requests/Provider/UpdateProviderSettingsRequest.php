<?php

namespace App\Http\Requests\Provider;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProviderSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('provider');
    }

    public function rules(): array
    {
        return [
            // Tab 4 — Service
            'default_profession' => ['sometimes', 'nullable', 'string', 'max:100'],
            'default_price_type' => ['sometimes', 'in:fixed,hourly,negotiable'],
            'default_price_value' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'service_mode' => ['sometimes', 'in:online,onsite,both'],
            'booking_mode' => ['sometimes', 'in:request,calendar'],

            // Tab 5 — Availability
            'working_days' => ['sometimes', 'array'],
            'working_days.*' => ['string', 'in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday'],
            'working_hours_start' => ['sometimes', 'date_format:H:i'],
            'working_hours_end' => ['sometimes', 'date_format:H:i', 'after:working_hours_start'],
            'slot_duration_minutes' => ['sometimes', 'integer', 'in:15,30,45,60,90'],

            // Tab 7 — Notifications
            'notify_bookings' => ['sometimes', 'boolean'],
            'notify_messages' => ['sometimes', 'boolean'],
            'notify_reviews' => ['sometimes', 'boolean'],
            'notify_promotions' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'default_price_type.in' => 'ფასის ტიპი: fixed, hourly ან negotiable.',
            'service_mode.in' => 'სერვისის რეჟიმი: online, onsite ან both.',
            'booking_mode.in' => 'დაჯავშნის რეჟიმი: request ან calendar.',
            'working_days.*.in' => 'სამუშაო დღე არასწორია.',
            'working_hours_start.date_format' => 'დაწყების დრო HH:MM ფორმატში.',
            'working_hours_end.date_format' => 'დასრულების დრო HH:MM ფორმატში.',
            'working_hours_end.after' => 'დასრულების დრო უნდა იყოს დაწყების შემდეგ.',
            'slot_duration_minutes.in' => 'სლოტი: 15, 30, 45, 60 ან 90 წუთი.',
        ];
    }
}
