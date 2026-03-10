<?php

namespace App\Repositories\Contracts;

use App\Models\Listing;
use App\Models\User;
use Illuminate\Support\Collection;

interface SavedListingRepositoryInterface
{
    public function getForUser(User $user): Collection;

    public function save(User $user, Listing $listing): void;

    public function remove(User $user, Listing $listing): void;

    public function isSaved(User $user, Listing $listing): bool;
}
