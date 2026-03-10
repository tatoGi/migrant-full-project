<?php

namespace App\Services;

use App\Models\Listing;
use App\Repositories\Contracts\ListingRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;

class AdminListingService
{
    public function __construct(
        private readonly ListingRepositoryInterface $listingRepository,
    ) {}

    public function getAll(?string $search = null): LengthAwarePaginator
    {
        return $this->listingRepository->getAllForAdmin($search);
    }

    public function getStats(): array
    {
        return $this->listingRepository->getAdminStats();
    }

    public function update(Listing $listing, array $data): Listing
    {
        return $this->listingRepository->update($listing, $data);
    }

    public function delete(Listing $listing): void
    {
        $this->listingRepository->delete($listing);
    }
}
