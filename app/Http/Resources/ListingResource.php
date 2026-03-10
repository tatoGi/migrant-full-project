<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class ListingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
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
            'photos' => collect($this->photos ?? [])->map(fn ($p) => Storage::url($p))->values()->all(),
            'photo' => collect($this->photos ?? [])->map(fn ($p) => Storage::url($p))->first(),
            'is_vip' => $this->listing_type === 'vip',
            'booking_mode' => $this->booking_mode,
            'status' => $this->status,
            'views_count' => $this->views_count,
            'created_at' => $this->created_at?->toDateString(),
            'saved_at' => $this->when($this->pivot !== null, fn () => $this->pivot->created_at?->toDateTimeString()),
            'user' => new UserResource($this->whenLoaded('user')),
        ];
    }
}
