<?php

namespace App\Repositories;

use App\Models\Listing;
use App\Models\User;
use App\Repositories\Contracts\ListingRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class ListingRepository implements ListingRepositoryInterface
{
    public function getForProvider(User $user): LengthAwarePaginator
    {
        return Listing::where('user_id', $user->id)
            ->latest()
            ->paginate(15);
    }

    public function getVipForHomepage(int $limit = 8): Collection
    {
        return Listing::with('user')
            ->where('status', 'active')
            ->where('listing_type', 'vip')
            ->latest()
            ->limit($limit)
            ->get();
    }

    public function getAllForAdmin(?string $search = null): LengthAwarePaginator
    {
        return Listing::with('user')
            ->when($search, fn ($q) => $q->where(function ($q) use ($search) {
                $q->where('provider_name', 'like', "%{$search}%")
                    ->orWhere('profession', 'like', "%{$search}%")
                    ->orWhere('city', 'like', "%{$search}%");
            }))
            ->latest()
            ->paginate(20);
    }

    public function getAdminStats(): array
    {
        return [
            'total' => Listing::count(),
            'active' => Listing::where('status', 'active')->count(),
            'vip' => Listing::where('listing_type', 'vip')->count(),
        ];
    }

    public function create(array $data): Listing
    {
        return Listing::create($data);
    }

    public function update(Listing $listing, array $data): Listing
    {
        $listing->update($data);

        return $listing->fresh();
    }

    public function delete(Listing $listing): void
    {
        $listing->delete();
    }

    public function findById(int $id): ?Listing
    {
        return Listing::find($id);
    }

    public function getPublicListings(array $filters): LengthAwarePaginator
    {
        return QueryBuilder::for(Listing::class)
            ->allowedFilters([
                AllowedFilter::exact('profession'),
                AllowedFilter::exact('country'),
                AllowedFilter::exact('city'),
                AllowedFilter::exact('nationality'),
                AllowedFilter::exact('listing_type'),
                AllowedFilter::callback('language', fn ($query, $value) =>
                    $query->whereJsonContains('languages', $value)
                ),
                AllowedFilter::callback('search', fn ($query, $value) =>
                    $query->where(function ($q) use ($value) {
                        $q->where('provider_name', 'like', "%{$value}%")
                          ->orWhere('profession', 'like', "%{$value}%")
                          ->orWhere('city', 'like', "%{$value}%")
                          ->orWhere('description', 'like', "%{$value}%");
                    })
                ),
            ])
            ->allowedSorts(['created_at', 'views_count', 'price_value'])
            ->defaultSort('-created_at')
            ->where('status', 'active')
            ->paginate(12)
            ->appends($filters);
    }

    public function incrementViews(Listing $listing): void
    {
        $listing->increment('views_count');
    }
}
