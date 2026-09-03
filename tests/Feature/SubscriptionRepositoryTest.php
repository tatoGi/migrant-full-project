<?php

namespace Tests\Feature;

use App\Models\Listing;
use App\Models\User;
use App\Repositories\Contracts\SubscriptionRepositoryInterface;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SubscriptionRepositoryTest extends TestCase
{
    use RefreshDatabase;

    private SubscriptionRepositoryInterface $repository;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        $this->repository = app(SubscriptionRepositoryInterface::class);
    }

    private function makeListing(): Listing
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
            'listing_type' => 'standard',
            'price_type' => 'fixed',
            'price_value' => 100,
            'booking_mode' => 'request',
            'status' => 'pending_payment',
        ]);
    }

    public function test_create_and_find_by_order_id(): void
    {
        $listing = $this->makeListing();

        $subscription = $this->repository->create([
            'listing_id' => $listing->id,
            'user_id' => $listing->user_id,
            'plan' => 'standard',
            'amount' => 500,
            'currency' => 'GEL',
            'flitt_order_id' => 'order-abc',
            'status' => 'pending',
        ]);

        $found = $this->repository->findByOrderId('order-abc');

        $this->assertTrue($found->is($subscription));
        $this->assertTrue($this->repository->findForListing($listing)->is($subscription));
        $this->assertNull($this->repository->findByOrderId('does-not-exist'));
    }

    public function test_log_event_is_idempotent_per_subscription_payment_and_status(): void
    {
        $listing = $this->makeListing();

        $subscription = $this->repository->create([
            'listing_id' => $listing->id,
            'user_id' => $listing->user_id,
            'plan' => 'standard',
            'amount' => 500,
            'currency' => 'GEL',
            'flitt_order_id' => 'order-abc',
            'status' => 'pending',
        ]);

        $this->assertFalse($this->repository->eventExists($subscription->id, '805230052', 'approved'));

        $this->repository->logEvent($subscription->id, '805230052', 'approved', ['order_status' => 'approved']);

        $this->assertTrue($this->repository->eventExists($subscription->id, '805230052', 'approved'));
    }
}
