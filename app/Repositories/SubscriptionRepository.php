<?php

namespace App\Repositories;

use App\Models\Listing;
use App\Models\Subscription;
use App\Models\SubscriptionEvent;
use App\Repositories\Contracts\SubscriptionRepositoryInterface;

class SubscriptionRepository implements SubscriptionRepositoryInterface
{
    public function create(array $data): Subscription
    {
        return Subscription::create($data);
    }

    public function update(Subscription $subscription, array $data): Subscription
    {
        $subscription->update($data);

        return $subscription->fresh();
    }

    public function findByOrderId(string $orderId): ?Subscription
    {
        return Subscription::where('flitt_order_id', $orderId)->first();
    }

    public function findForListing(Listing $listing): ?Subscription
    {
        return Subscription::where('listing_id', $listing->id)->latest()->first();
    }

    public function eventExists(int $subscriptionId, ?string $paymentId, string $orderStatus): bool
    {
        return SubscriptionEvent::where('subscription_id', $subscriptionId)
            ->where('flitt_payment_id', $paymentId)
            ->where('order_status', $orderStatus)
            ->exists();
    }

    public function logEvent(int $subscriptionId, ?string $paymentId, string $orderStatus, array $payload): void
    {
        SubscriptionEvent::create([
            'subscription_id' => $subscriptionId,
            'flitt_payment_id' => $paymentId,
            'order_status' => $orderStatus,
            'payload' => $payload,
        ]);
    }
}
