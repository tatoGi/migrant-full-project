<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ListingResource;
use App\Repositories\Contracts\ListingRepositoryInterface;
use App\Services\SavedListingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClientSavedListingController extends Controller
{
    public function __construct(
        private readonly SavedListingService $savedListingService,
        private readonly ListingRepositoryInterface $listingRepository,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $listings = $this->savedListingService->getSavedListings($request->user());

        return response()->json([
            'saved_listings' => ListingResource::collection($listings),
            'meta' => [
                'total' => $listings->count(),
            ],
        ]);
    }

    public function store(Request $request, int $listingId): JsonResponse
    {
        $listing = $this->listingRepository->findById($listingId);

        if (! $listing) {
            return response()->json(['message' => 'განცხადება ვერ მოიძებნა.'], 404);
        }

        $created = $this->savedListingService->save($request->user(), $listing);

        return response()->json([
            'message' => $created
                ? 'განცხადება შენახულებში დაემატა.'
                : 'განცხადება უკვე შენახულებშია.',
            'saved' => true,
        ], $created ? 201 : 200);
    }

    public function destroy(Request $request, int $listingId): JsonResponse
    {
        $listing = $this->listingRepository->findById($listingId);

        if (! $listing) {
            return response()->json(['message' => 'განცხადება ვერ მოიძებნა.'], 404);
        }

        $removed = $this->savedListingService->remove($request->user(), $listing);

        return response()->json([
            'message' => $removed
                ? 'განცხადება შენახულებიდან წაიშალა.'
                : 'განცხადება შენახულებში არ იყო.',
            'saved' => false,
        ]);
    }
}
