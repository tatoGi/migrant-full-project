<?php

namespace App\Services;

use App\Models\Listing;
use App\Models\User;
use App\Repositories\Contracts\SavedListingRepositoryInterface;
use Illuminate\Support\Collection;

class SavedListingService
{
    public function __construct(
        private readonly SavedListingRepositoryInterface $savedListingRepository,
    ) {}

    public function getSavedListings(User $user): Collection
    {
        return $this->savedListingRepository->getForUser($user);
    }

    public function save(User $user, Listing $listing): bool
    {
        $alreadySaved = $this->savedListingRepository->isSaved($user, $listing);

        if (! $alreadySaved) {
            $this->savedListingRepository->save($user, $listing);
        }

        return ! $alreadySaved;
    }

    public function remove(User $user, Listing $listing): bool
    {
        $wasSaved = $this->savedListingRepository->isSaved($user, $listing);

        if ($wasSaved) {
            $this->savedListingRepository->remove($user, $listing);
        }

        return $wasSaved;
    }
}
