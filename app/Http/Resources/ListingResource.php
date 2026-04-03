<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ListingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'provider_id' => $this->user_id,
            'provider_name' => $this->provider_name,
            'phone' => $this->phone,
            'email' => $this->email,
            'nationality' => $this->nationality,
            'languages' => $this->languages,
            'profession' => $this->profession,
            'country' => $this->country,
            'city' => $this->city,
            'description' => $this->description,
            'listing_type' => $this->listing_type,
            'price_type' => $this->price_type,
            'price_value' => $this->price_value,
            'photos' => $this->getMedia('photos')->map(fn ($m) => [
                'uuid' => $m->uuid,
                'url' => $m->getUrl(),
            ])->values()->all(),
            'photo' => $this->getFirstMediaUrl('photos') ?: null,
            'is_vip' => $this->listing_type === 'vip',
            'booking_mode' => $this->booking_mode,
            'status' => $this->status,
            'views_count' => $this->views_count,
            'created_at' => $this->created_at?->toDateString(),
            'working_days' => $this->whenLoaded('user', fn () => $this->user->providerSettings?->working_days),
            'working_hours_start' => $this->whenLoaded('user', fn () => $this->user->providerSettings?->working_hours_start),
            'working_hours_end' => $this->whenLoaded('user', fn () => $this->user->providerSettings?->working_hours_end),
            'saved_at' => $this->when($this->pivot !== null, fn () => $this->pivot->created_at?->toDateTimeString()),
            'user' => new UserResource($this->whenLoaded('user')),
        ];
    }
}
