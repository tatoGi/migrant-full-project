<?php

namespace App\Repositories;

use App\Models\Listing;
use App\Models\User;
use App\Repositories\Contracts\SavedListingRepositoryInterface;
use Illuminate\Support\Collection;

class SavedListingRepository implements SavedListingRepositoryInterface
{
    public function getForUser(User $user): Collection
    {
        return $user->savedListings()
            ->with('user')
            ->latest('saved_listings.created_at')
            ->get();
    }

    public function save(User $user, Listing $listing): void
    {
        $user->savedListings()->syncWithoutDetaching([$listing->id]);
    }

    public function remove(User $user, Listing $listing): void
    {
        $user->savedListings()->detach($listing->id);
    }

    public function isSaved(User $user, Listing $listing): bool
    {
        return $user->savedListings()
            ->where('listings.id', $listing->id)
            ->exists();
    }
}
