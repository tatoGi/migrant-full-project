<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ListingResource;
use App\Repositories\Contracts\ListingRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicListingController extends Controller
{
    public function __construct(
        private readonly ListingRepositoryInterface $listingRepository,
    ) {}

    // GET /api/listings?filter[profession]=lawyer&filter[city]=Berlin&filter[language]=en&sort=-created_at
    public function index(Request $request): JsonResponse
    {
        $listings = $this->listingRepository->getPublicListings($request->query());

        return response()->json([
            'data' => ListingResource::collection($listings),
            'meta' => [
                'current_page' => $listings->currentPage(),
                'last_page'    => $listings->lastPage(),
                'total'        => $listings->total(),
            ],
        ]);
    }

    // GET /api/listings/{id}
    public function show(int $id): JsonResponse
    {
        $listing = $this->listingRepository->findById($id);

        if (! $listing || $listing->status !== 'active') {
            return response()->json(['message' => 'განცხადება ვერ მოიძებნა.'], 404);
        }

        $this->listingRepository->incrementViews($listing);

        return response()->json(new ListingResource($listing->fresh()));
    }
}
