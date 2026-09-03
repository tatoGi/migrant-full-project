<?php

namespace Tests\Feature;

use App\Models\Listing;
use App\Models\Subscription;
use App\Models\SubscriptionEvent;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SubscriptionModelTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
    }

    public function test_listing_can_be_created_with_pending_payment_status(): void
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
            'listing_type' => 'standard',
            'price_type' => 'fixed',
            'price_value' => 100,
            'booking_mode' => 'request',
            'status' => 'pending_payment',
        ]);

        $this->assertSame('pending_payment', $listing->fresh()->status);
    }

    public function test_subscription_belongs_to_listing_and_user_and_has_events(): void
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
            'listing_type' => 'standard',
            'price_type' => 'fixed',
            'price_value' => 100,
            'booking_mode' => 'request',
            'status' => 'pending_payment',
        ]);

        $subscription = Subscription::create([
            'listing_id' => $listing->id,
            'user_id' => $provider->id,
            'plan' => 'standard',
            'amount' => 500,
            'currency' => 'GEL',
            'flitt_order_id' => 'listing-1-abc123',
            'status' => 'pending',
        ]);

        SubscriptionEvent::create([
            'subscription_id' => $subscription->id,
            'flitt_payment_id' => '805230052',
            'order_status' => 'approved',
            'payload' => ['order_status' => 'approved'],
        ]);

        $this->assertTrue($subscription->listing->is($listing));
        $this->assertTrue($subscription->user->is($provider));
        $this->assertCount(1, $subscription->fresh()->events);
        $this->assertSame('approved', $subscription->events->first()->order_status);
        $this->assertSame(['order_status' => 'approved'], $subscription->events->first()->payload);
    }
}
