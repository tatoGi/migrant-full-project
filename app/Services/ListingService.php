<?php

namespace App\Services;

use App\Data\StoreListingData;
use App\Models\Listing;
use App\Models\User;
use App\Repositories\Contracts\ListingRepositoryInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ListingService
{
    public function __construct(
        private readonly ListingRepositoryInterface $listingRepository,
    ) {}

    public function getProviderListings(User $user): LengthAwarePaginator
    {
        return $this->listingRepository->getForProvider($user);
    }

    public function getHomepageVipListings(int $limit = 8): Collection
    {
        return $this->listingRepository->getVipForHomepage($limit);
    }

    public function getProviderStats(User $user): array
    {
        $listings = $user->listings ?? Listing::where('user_id', $user->id)->get();

        return [
            'total' => $listings->count(),
            'active' => $listings->where('status', 'active')->count(),
            'views_total' => $listings->sum('views_count'),
        ];
    }

    public function store(User $user, StoreListingData $data): Listing
    {
        $tokens = $data->photos ?? [];

        $listing = $this->listingRepository->create([
            'user_id' => $user->id,
            'provider_name' => $data->provider_name,
            'phone' => $data->phone,
            'email' => $data->email,
            'nationality' => $data->nationality,
            'languages' => $data->languages,
            'profession' => $data->profession,
            'country' => $data->country,
            'city' => $data->city,
            'description' => $data->description,
            'listing_type' => $data->listing_type,
            'price_type' => $data->price_type,
            'price_value' => $data->price_value,
            'booking_mode' => $data->booking_mode,
        ]);

        // Move temp photos into MediaLibrary: temp/{token}.jpg → media collection
        foreach ($tokens as $token) {
            $tempFiles = Storage::disk('public')->files('temp');
            $tempPath = collect($tempFiles)->first(
                fn ($f) => Str::startsWith(basename($f), $token)
            );

            if ($tempPath) {
                $listing
                    ->addMediaFromDisk($tempPath, 'public')
                    ->toMediaCollection('photos');

                Storage::disk('public')->delete($tempPath);
            }
        }

        return $listing->fresh();
    }

    public function update(Listing $listing, array $data): Listing
    {
        unset($data['photos']);

        return $this->listingRepository->update($listing, $data);
    }

    public function delete(Listing $listing): void
    {
        // MediaLibrary auto-deletes associated media when the model is deleted
        $this->listingRepository->delete($listing);
    }

    public function uploadPhoto(Listing $listing, UploadedFile $file): array
    {
        $media = $listing
            ->addMedia($file)
            ->toMediaCollection('photos');

        return [
            'uuid' => $media->uuid,
            'url' => $media->getUrl(),
        ];
    }

    public function removePhoto(Listing $listing, string $uuid): bool
    {
        $media = $listing->getMedia('photos')->firstWhere('uuid', $uuid);

        if (! $media) {
            return false;
        }

        $media->delete();

        return true;
    }
}
