<?php

namespace Tests\Feature;

use App\Models\Listing;
use App\Models\Subscription;
use App\Models\User;
use App\Services\SubscriptionService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SubscriptionServiceTest extends TestCase
{
    use RefreshDatabase;

    private SubscriptionService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        config(['flitt.merchant_id' => 153, 'flitt.payment_key' => 'test-secret']);
        $this->service = app(SubscriptionService::class);
    }

    private function makeListing(string $listingType = 'standard'): Listing
    {
        $provider = User::factory()->create();
        $provider->assignRole('provider');

        return Listing::create([
            'user_id' => $provider->id,
            'provider_name' => 'Test Provider',
            'phone' => '+995555000000',
            'nationality' => 'Georgian',
            'languages' => ['Georgian'],
            'profession' => 'Lawyer',
            'country' => 'Germany',
            'city' => ['Berlin'],
            'description' => 'Test listing description',
            'listing_type' => $listingType,
            'price_type' => 'fixed',
            'price_value' => 100,
            'booking_mode' => 'request',
            'status' => 'pending_payment',
        ]);
    }

    public function test_create_for_listing_prices_standard_plan_with_trial_and_returns_checkout_url(): void
    {
        Http::fake([
            'pay.flitt.com/*' => Http::response(['response' => ['checkout_url' => 'https://pay.flitt.com/x']]),
        ]);

        $listing = $this->makeListing('standard');

        $result = $this->service->createForListing($listing);

        $this->assertSame('https://pay.flitt.com/x', $result['checkout_url']);
        $this->assertSame('standard', $result['subscription']->plan);
        $this->assertSame(500, $result['subscription']->amount);
        $this->assertSame('pending', $result['subscription']->status);

        Http::assertSent(function ($request) {
            $body = json_decode(base64_decode($request->data()['request']['data']), true)['order'];

            return $body['recurring_data']['trial_period'] === 'month'
                && $body['recurring_data']['trial_quantity'] === 1
                && $body['amount'] === 500;
        });
    }

    public function test_create_for_listing_prices_vip_plan_without_trial(): void
    {
        Http::fake([
            'pay.flitt.com/*' => Http::response(['response' => ['checkout_url' => 'https://pay.flitt.com/x']]),
        ]);

        $listing = $this->makeListing('vip');

        $result = $this->service->createForListing($listing);

        $this->assertSame('vip', $result['subscription']->plan);
        $this->assertSame(2000, $result['subscription']->amount);

        Http::assertSent(function ($request) {
            $body = json_decode(base64_decode($request->data()['request']['data']), true)['order'];

            return ! isset($body['recurring_data']['trial_period']) && $body['amount'] === 2000;
        });
    }

    public function test_handle_callback_activates_listing_and_starts_trial_on_first_approval_for_standard_plan(): void
    {
        Http::fake(['pay.flitt.com/*' => Http::response(['response' => ['checkout_url' => 'https://pay.flitt.com/x']])]);

        $listing = $this->makeListing('standard');
        $result = $this->service->createForListing($listing);
        $subscription = $result['subscription'];

        $this->service->handleCallback([
            'order_id' => $subscription->flitt_order_id,
            'order_status' => 'approved',
            'payment_id' => 'pay_1',
        ]);

        $subscription->refresh();
        $this->assertSame('trialing', $subscription->status);
        $this->assertNotNull($subscription->trial_ends_at);
        $this->assertSame('active', $listing->fresh()->status);
    }

    public function test_handle_callback_marks_listing_inactive_on_declined(): void
    {
        Http::fake(['pay.flitt.com/*' => Http::response(['response' => ['checkout_url' => 'https://pay.flitt.com/x']])]);

        $listing = $this->makeListing('vip');
        $result = $this->service->createForListing($listing);
        $subscription = $result['subscription'];

        $this->service->handleCallback([
            'order_id' => $subscription->flitt_order_id,
            'order_status' => 'declined',
            'payment_id' => 'pay_2',
        ]);

        $this->assertSame('past_due', $subscription->fresh()->status);
        $this->assertSame('inactive', $listing->fresh()->status);
    }

    public function test_handle_callback_ignores_unknown_order_id(): void
    {
        $this->service->handleCallback([
            'order_id' => 'unknown-order',
            'order_status' => 'approved',
            'payment_id' => 'pay_3',
        ]);

        $this->addToAssertionCount(1); // no exception thrown
    }

    public function test_cancel_calls_flitt_and_marks_subscription_and_listing(): void
    {
        Http::fake([
            'pay.flitt.com/api/checkout/url' => Http::response(['response' => ['checkout_url' => 'https://pay.flitt.com/x']]),
            'pay.flitt.com/api/subscription' => Http::response(['response' => ['status' => 'disabled']]),
        ]);

        $listing = $this->makeListing('vip');
        $result = $this->service->createForListing($listing);

        $this->service->cancel($result['subscription']);

        $this->assertSame('cancelled', $result['subscription']->fresh()->status);
        $this->assertSame('inactive', $listing->fresh()->status);

        Http::assertSent(fn ($request) => $request->url() === 'https://pay.flitt.com/api/subscription');
    }
}
