<?php

namespace App\Repositories\Contracts;

use App\Models\Listing;
use App\Models\Subscription;

interface SubscriptionRepositoryInterface
{
    public function create(array $data): Subscription;

    public function update(Subscription $subscription, array $data): Subscription;

    public function findByOrderId(string $orderId): ?Subscription;

    public function findForListing(Listing $listing): ?Subscription;

    public function eventExists(int $subscriptionId, ?string $paymentId, string $orderStatus): bool;

    public function logEvent(int $subscriptionId, ?string $paymentId, string $orderStatus, array $payload): void;
}
