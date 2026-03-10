<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProviderSettingsResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            // Tab 4 — Service
            'default_profession' => $this->default_profession,
            'default_price_type' => $this->default_price_type,
            'default_price_value' => $this->default_price_value,
            'service_mode' => $this->service_mode,
            'booking_mode' => $this->booking_mode,

            // Tab 5 — Availability
            'working_days' => $this->working_days ?? [],
            'working_hours_start' => $this->working_hours_start,
            'working_hours_end' => $this->working_hours_end,
            'slot_duration_minutes' => $this->slot_duration_minutes,

            // Tab 7 — Notifications
            'notify_bookings' => $this->notify_bookings,
            'notify_messages' => $this->notify_messages,
            'notify_reviews' => $this->notify_reviews,
            'notify_promotions' => $this->notify_promotions,
        ];
    }
}
