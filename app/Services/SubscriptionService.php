<?php

namespace App\Services;

use App\Clients\FlittClient;
use App\Models\Listing;
use App\Models\Subscription;
use App\Repositories\Contracts\SubscriptionRepositoryInterface;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SubscriptionService
{
    private const PLAN_PRICING = [
        'standard' => 500,
        'vip' => 2000,
    ];

    private const FAILURE_STATUS_MAP = [
        'declined' => 'past_due',
        'expired' => 'past_due',
        'reversed' => 'cancelled',
    ];

    public function __construct(
        private readonly SubscriptionRepositoryInterface $subscriptions,
        private readonly FlittClient $flitt,
    ) {}

    public function createForListing(Listing $listing): array
    {
        $plan = $listing->listing_type === 'vip' ? 'vip' : 'standard';
        $amount = self::PLAN_PRICING[$plan];
        $orderId = $this->generateOrderId($listing);

        $subscription = $this->subscriptions->create([
            'listing_id' => $listing->id,
            'user_id' => $listing->user_id,
            'plan' => $plan,
            'amount' => $amount,
            'currency' => 'GEL',
            'flitt_order_id' => $orderId,
            'status' => 'pending',
        ]);

        $checkoutUrl = $this->requestCheckout($listing, $orderId, $plan, $amount);

        return ['subscription' => $subscription, 'checkout_url' => $checkoutUrl];
    }

    public function regenerateCheckout(Listing $listing, Subscription $subscription): string
    {
        $orderId = $this->generateOrderId($listing);

        $subscription = $this->subscriptions->update($subscription, [
            'flitt_order_id' => $orderId,
            'flitt_payment_id' => null,
            'status' => 'pending',
        ]);

        return $this->requestCheckout($listing, $orderId, $subscription->plan, $subscription->amount);
    }

    public function cancel(Subscription $subscription): void
    {
        $this->flitt->cancelSubscription($subscription->flitt_order_id);

        $this->subscriptions->update($subscription, ['status' => 'cancelled']);
        $subscription->listing->update(['status' => 'inactive']);
    }

    public function handleCallback(array $payload): void
    {
        $orderId = $payload['order_id'] ?? null;
        $orderStatus = $payload['order_status'] ?? null;
        $paymentId = $payload['payment_id'] ?? null;

        if (! $orderId || ! $orderStatus) {
            return;
        }

        $subscription = $this->subscriptions->findByOrderId($orderId);

        if (! $subscription) {
            return;
        }

        if ($this->subscriptions->eventExists($subscription->id, $paymentId, $orderStatus)) {
            return;
        }

        $this->subscriptions->logEvent($subscription->id, $paymentId, $orderStatus, $payload);

        $this->applyStatusTransition($subscription, $orderStatus, $paymentId);
    }

    private function applyStatusTransition(Subscription $subscription, string $orderStatus, ?string $paymentId): void
    {
        $updates = ['flitt_payment_id' => $paymentId ?? $subscription->flitt_payment_id];

        if (in_array($orderStatus, ['approved', 'processing'], true)) {
            if ($subscription->status === 'pending' && $subscription->plan === 'standard') {
                $updates['status'] = 'trialing';
                $updates['trial_ends_at'] = now()->addMonth();
            } else {
                $updates['status'] = 'active';
            }

            $this->subscriptions->update($subscription, $updates);
            $subscription->listing->update(['status' => 'active']);

            return;
        }

        if (array_key_exists($orderStatus, self::FAILURE_STATUS_MAP)) {
            $updates['status'] = self::FAILURE_STATUS_MAP[$orderStatus];
            $this->subscriptions->update($subscription, $updates);
            $subscription->listing->update(['status' => 'inactive']);
        }
    }

    private function requestCheckout(Listing $listing, string $orderId, string $plan, int $amount): string
    {
        $recurringData = [
            'amount' => $amount,
            'period' => 'month',
            'every' => 1,
            'end_time' => now()->addYears(10)->format('Y-m-d'),
        ];

        if ($plan === 'standard') {
            $recurringData['trial_period'] = 'month';
            $recurringData['trial_quantity'] = 1;
        }

        $response = $this->flitt->createOrder([
            'order_id' => $orderId,
            'order_desc' => "Emigrant.GE - {$plan} listing #{$listing->id}",
            'amount' => $amount,
            'currency' => 'GEL',
            'subscription' => 'Y',
            'recurring_data' => $recurringData,
            'server_callback_url' => rtrim(config('app.url'), '/').'/api/webhooks/flitt',
            'response_url' => rtrim(config('app.frontend_url'), '/').'/provider/dashboard',
        ]);

        if (empty($response['checkout_url'])) {
            Log::error('Flitt checkout URL was not returned', ['listing_id' => $listing->id, 'response' => $response]);
        }

        return $response['checkout_url'] ?? '';
    }

    private function generateOrderId(Listing $listing): string
    {
        return "listing-{$listing->id}-".Str::random(10);
    }
}
