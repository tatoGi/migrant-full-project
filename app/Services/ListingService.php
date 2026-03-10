<?php

namespace App\Services;

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

    public function store(User $user, array $data): Listing
    {
        // Create listing first (without photos)
        $listing = $this->listingRepository->create([
            ...$data,
            'user_id' => $user->id,
            'photos' => [],
        ]);

        // Move temp photos to permanent storage: temp/{token}.ext → listings/{id}/{token}.ext
        if (! empty($data['photos'])) {
            $permanentPaths = [];

            foreach ($data['photos'] as $token) {
                $tempFiles = Storage::disk('public')->files('temp');
                $tempPath = collect($tempFiles)->first(
                    fn ($f) => Str::startsWith(basename($f), $token)
                );

                if ($tempPath) {
                    $ext = pathinfo($tempPath, PATHINFO_EXTENSION);
                    $newPath = "listings/{$listing->id}/{$token}.{$ext}";
                    Storage::disk('public')->move($tempPath, $newPath);
                    $permanentPaths[] = $newPath;
                }
            }

            $this->listingRepository->update($listing, ['photos' => $permanentPaths]);
            $listing = $listing->fresh();
        }

        return $listing;
    }

    public function update(Listing $listing, array $data): Listing
    {
        return $this->listingRepository->update($listing, $data);
    }

    public function delete(Listing $listing): void
    {
        // Delete all stored photos from disk
        foreach ($listing->photos ?? [] as $path) {
            Storage::disk('public')->delete($path);
        }

        $this->listingRepository->delete($listing);
    }

    public function uploadPhoto(Listing $listing, UploadedFile $file): string
    {
        $path = $file->store("listings/{$listing->id}", 'public');

        $photos = $listing->photos ?? [];
        $photos[] = $path;

        $this->listingRepository->update($listing, ['photos' => $photos]);

        return Storage::url($path);
    }

    public function removePhoto(Listing $listing, int $index): void
    {
        $photos = $listing->photos ?? [];

        if (! isset($photos[$index])) {
            return;
        }

        Storage::disk('public')->delete($photos[$index]);

        array_splice($photos, $index, 1);

        $this->listingRepository->update($listing, ['photos' => array_values($photos)]);
    }
}
