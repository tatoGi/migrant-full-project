<?php

namespace App\Http\Controllers\Api;

use App\Data\StoreListingData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Listing\StoreListingPhotoRequest;
use App\Http\Requests\Listing\StoreListingRequest;
use App\Http\Requests\Listing\UpdateListingRequest;
use App\Http\Resources\ListingResource;
use App\Repositories\Contracts\ListingRepositoryInterface;
use App\Services\ListingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ListingController extends Controller
{
    public function __construct(
        private readonly ListingService $listingService,
        private readonly ListingRepositoryInterface $listingRepository,
    ) {}

    // GET /api/listings/vip
    public function vip(): JsonResponse
    {
        $listings = $this->listingService->getHomepageVipListings();

        return response()->json([
            'listings' => ListingResource::collection($listings),
            'meta' => [
                'total' => $listings->count(),
            ],
        ]);
    }

    // GET /api/provider/listings
    public function index(Request $request): JsonResponse
    {
        $listings = $this->listingService->getProviderListings($request->user());
        $stats = $this->listingService->getProviderStats($request->user());

        return response()->json([
            'stats' => $stats,
            'listings' => ListingResource::collection($listings),
            'meta' => [
                'current_page' => $listings->currentPage(),
                'last_page' => $listings->lastPage(),
                'total' => $listings->total(),
            ],
        ]);
    }

    // POST /api/provider/listings
    public function store(StoreListingRequest $request): JsonResponse
    {
        $listing = $this->listingService->store(
            $request->user(),
            StoreListingData::from($request->validated())
        );

        return response()->json(new ListingResource($listing), 201);
    }

    // PUT /api/provider/listings/{id}
    public function update(UpdateListingRequest $request, int $id): JsonResponse
    {
        $listing = $this->listingRepository->findById($id);

        if (! $listing || $listing->user_id !== $request->user()->id) {
            return response()->json(['message' => 'განცხადება ვერ მოიძებნა.'], 404);
        }

        $updated = $this->listingService->update($listing, $request->validated());

        return response()->json(new ListingResource($updated));
    }

    // DELETE /api/provider/listings/{id}
    public function destroy(Request $request, int $id): JsonResponse
    {
        $listing = $this->listingRepository->findById($id);

        if (! $listing || $listing->user_id !== $request->user()->id) {
            return response()->json(['message' => 'განცხადება ვერ მოიძებნა.'], 404);
        }

        $this->listingService->delete($listing);

        return response()->json(['message' => 'განცხადება წაიშალა.']);
    }

    // POST /api/provider/listings/{id}/photos
    public function uploadPhoto(StoreListingPhotoRequest $request, int $id): JsonResponse
    {
        $listing = $this->listingRepository->findById($id);

        if (! $listing || $listing->user_id !== $request->user()->id) {
            return response()->json(['message' => 'განცხადება ვერ მოიძებნა.'], 404);
        }

        $photo = $this->listingService->uploadPhoto($listing, $request->file('photo'));

        return response()->json([
            'uuid' => $photo['uuid'],
            'url' => $photo['url'],
            'photos' => ListingResource::make($listing->fresh())->toArray($request)['photos'],
        ], 201);
    }

    // DELETE /api/provider/listings/{id}/photos/{uuid}
    public function removePhoto(Request $request, int $id, string $uuid): JsonResponse
    {
        $listing = $this->listingRepository->findById($id);

        if (! $listing || $listing->user_id !== $request->user()->id) {
            return response()->json(['message' => 'განცხადება ვერ მოიძებნა.'], 404);
        }

        if (! $this->listingService->removePhoto($listing, $uuid)) {
            return response()->json(['message' => 'ფოტო ვერ მოიძებნა.'], 404);
        }

        return response()->json([
            'message' => 'ფოტო წაიშალა.',
            'photos' => ListingResource::make($listing->fresh())->toArray($request)['photos'],
        ]);
    }
}
