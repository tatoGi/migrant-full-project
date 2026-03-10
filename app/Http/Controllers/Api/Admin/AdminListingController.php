<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateListingRequest;
use App\Http\Resources\ListingResource;
use App\Repositories\Contracts\ListingRepositoryInterface;
use App\Services\AdminListingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminListingController extends Controller
{
    public function __construct(
        private readonly AdminListingService $adminListingService,
        private readonly ListingRepositoryInterface $listingRepository,
    ) {}

    // GET /api/admin/listings?search=lawyer
    public function index(Request $request): JsonResponse
    {
        $listings = $this->adminListingService->getAll($request->query('search'));
        $stats = $this->adminListingService->getStats();

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

    // PUT /api/admin/listings/{id}
    public function update(UpdateListingRequest $request, int $id): JsonResponse
    {
        $listing = $this->listingRepository->findById($id);

        if (! $listing) {
            return response()->json(['message' => 'განცხადება ვერ მოიძებნა.'], 404);
        }

        $updated = $this->adminListingService->update($listing, $request->validated());

        return response()->json(new ListingResource($updated));
    }

    // DELETE /api/admin/listings/{id}
    public function destroy(int $id): JsonResponse
    {
        $listing = $this->listingRepository->findById($id);

        if (! $listing) {
            return response()->json(['message' => 'განცხადება ვერ მოიძებნა.'], 404);
        }

        $this->adminListingService->delete($listing);

        return response()->json(['message' => 'განცხადება წაიშალა.']);
    }
}
