<?php

namespace App\Data;

use Spatie\LaravelData\Attributes\Validation\In;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Data;

class StoreListingData extends Data
{
    public function __construct(
        public readonly string $provider_name,
        public readonly string $phone,
        public readonly string $nationality,
        public readonly array $languages,
        public readonly string $profession,
        public readonly string $country,
        public readonly array $city,
        public readonly string $description,
        #[In('standard', 'vip')]
        public readonly string $listing_type,
        #[In('fixed', 'hourly', 'negotiable')]
        public readonly string $price_type,
        #[Nullable, Min(0)]
        public readonly ?float $price_value,
        #[Nullable, Max(10)]
        public readonly ?array $photos,
        #[Nullable]
        public readonly ?string $email,
        #[Nullable, In('request', 'calendar')]
        public readonly string $booking_mode = 'request',
    ) {}
}
