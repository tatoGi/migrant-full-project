<?php

namespace Tests\Feature;

use App\Models\Listing;
use App\Models\Subscription;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FlittWebhookTest extends TestCase
{
    use RefreshDatabase;

    private const PAYMENT_KEY = 'test-secret';

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        config(['flitt.merchant_id' => 153, 'flitt.payment_key' => self::PAYMENT_KEY]);
    }

    private function sign(array $params): string
    {
        ksort($params);

        return sha1(self::PAYMENT_KEY.'|'.implode('|', array_values($params)));
    }

    private function makeSubscription(string $listingType = 'standard'): Subscription
    {
        $provider = User::factory()->create();
        $provider->assignRole('provider');

        $listing = Listing::create([
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

        return Subscription::create([
            'listing_id' => $listing->id,
            'user_id' => $provider->id,
            'plan' => $listingType,
            'amount' => $listingType === 'vip' ? 2000 : 500,
            'currency' => 'GEL',
            'flitt_order_id' => 'order-abc',
            'status' => 'pending',
        ]);
    }

    public function test_valid_approved_callback_activates_listing(): void
    {
        $subscription = $this->makeSubscription('vip');

        $payload = [
            'order_id' => $subscription->flitt_order_id,
            'merchant_id' => 153,
            'order_status' => 'approved',
            'payment_id' => 'pay_1',
        ];
        $payload['signature'] = $this->sign($payload);

        $this->postJson('/api/webhooks/flitt', $payload)->assertOk();

        $this->assertSame('active', $subscription->fresh()->status);
        $this->assertSame('active', $subscription->listing->fresh()->status);
    }

    public function test_invalid_signature_is_rejected_and_state_is_unchanged(): void
    {
        $subscription = $this->makeSubscription('vip');

        $payload = [
            'order_id' => $subscription->flitt_order_id,
            'merchant_id' => 153,
            'order_status' => 'approved',
            'payment_id' => 'pay_1',
            'signature' => 'not-a-real-signature',
        ];

        $this->postJson('/api/webhooks/flitt', $payload)->assertStatus(401);

        $this->assertSame('pending', $subscription->fresh()->status);
        $this->assertSame('pending_payment', $subscription->listing->fresh()->status);
    }

    public function test_duplicate_callback_is_not_processed_twice(): void
    {
        $subscription = $this->makeSubscription('vip');

        $payload = [
            'order_id' => $subscription->flitt_order_id,
            'merchant_id' => 153,
            'order_status' => 'approved',
            'payment_id' => 'pay_1',
        ];
        $payload['signature'] = $this->sign($payload);

        $this->postJson('/api/webhooks/flitt', $payload)->assertOk();
        $this->postJson('/api/webhooks/flitt', $payload)->assertOk();

        $this->assertDatabaseCount('subscription_events', 1);
    }

    public function test_declined_callback_marks_listing_inactive(): void
    {
        $subscription = $this->makeSubscription('standard');

        $payload = [
            'order_id' => $subscription->flitt_order_id,
            'merchant_id' => 153,
            'order_status' => 'declined',
            'payment_id' => 'pay_2',
        ];
        $payload['signature'] = $this->sign($payload);

        $this->postJson('/api/webhooks/flitt', $payload)->assertOk();

        $this->assertSame('past_due', $subscription->fresh()->status);
        $this->assertSame('inactive', $subscription->listing->fresh()->status);
    }
}
