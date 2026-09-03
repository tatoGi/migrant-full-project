<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Repositories\Contracts\ListingRepositoryInterface;
use App\Repositories\Contracts\SubscriptionRepositoryInterface;
use App\Services\SubscriptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    public function __construct(
        private readonly SubscriptionService $subscriptionService,
        private readonly SubscriptionRepositoryInterface $subscriptions,
        private readonly ListingRepositoryInterface $listings,
    ) {}

    public function checkout(Request $request, int $id): JsonResponse
    {
        $listing = $this->listings->findById($id);

        if (! $listing || $listing->user_id !== $request->user()->id) {
            return response()->json(['message' => 'განცხადება ვერ მოიძებნა.'], 404);
        }

        $subscription = $this->subscriptions->findForListing($listing);

        $checkoutUrl = $subscription
            ? $this->subscriptionService->regenerateCheckout($listing, $subscription)
            : $this->subscriptionService->createForListing($listing)['checkout_url'];

        return response()->json(['checkout_url' => $checkoutUrl]);
    }

    public function cancel(Request $request, int $id): JsonResponse
    {
        $listing = $this->listings->findById($id);

        if (! $listing || $listing->user_id !== $request->user()->id) {
            return response()->json(['message' => 'განცხადება ვერ მოიძებნა.'], 404);
        }

        $subscription = $this->subscriptions->findForListing($listing);

        if (! $subscription) {
            return response()->json(['message' => 'გამოწერა ვერ მოიძებნა.'], 404);
        }

        $this->subscriptionService->cancel($subscription);

        return response()->json(['message' => 'გამოწერა გაუქმდა.']);
    }
}
