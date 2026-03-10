<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'phone' => $this->phone,
            'country' => $this->country,
            'city' => $this->city,
            'nationality' => $this->nationality,
            'languages' => $this->languages ?? [],
            'email' => $this->user->email,
            'notifications' => [
                'listing_updates' => (bool) $this->notification_listing_updates,
                'new_messages' => (bool) $this->notification_new_messages,
                'promotions' => (bool) $this->notification_promotions,
            ],
        ];
    }
}
