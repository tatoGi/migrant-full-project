<?php

namespace App\Repositories\Contracts;

use App\Models\Listing;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface ListingRepositoryInterface
{
    public function getForProvider(User $user): LengthAwarePaginator;

    public function getVipForHomepage(int $limit = 8): Collection;

    public function getAllForAdmin(?string $search = null): LengthAwarePaginator;

    public function getAdminStats(): array;

    public function create(array $data): Listing;

    public function update(Listing $listing, array $data): Listing;

    public function delete(Listing $listing): void;

    public function findById(int $id): ?Listing;

    public function findBySlug(string $slug): ?Listing;

    public function findBySlugWithSettings(string $slug): ?Listing;

    public function getPublicListings(array $filters): LengthAwarePaginator;

    public function incrementViews(Listing $listing): void;
}
