<?php

namespace Tests\Feature;

use App\Models\Listing;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SubscriptionControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        config(['flitt.merchant_id' => 153, 'flitt.payment_key' => 'test-secret']);
    }

    private function makeListing(User $provider, string $listingType = 'standard'): Listing
    {
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

    public function test_provider_can_request_a_fresh_checkout_url_for_own_listing(): void
    {
        Http::fake(['pay.flitt.com/*' => Http::response(['response' => ['checkout_url' => 'https://pay.flitt.com/x']])]);

        $provider = User::factory()->create();
        $provider->assignRole('provider');
        Sanctum::actingAs($provider);

        $listing = $this->makeListing($provider);

        $this->postJson("/api/provider/listings/{$listing->id}/checkout")
            ->assertOk()
            ->assertJsonPath('checkout_url', 'https://pay.flitt.com/x');

        $this->assertDatabaseCount('subscriptions', 1);
    }

    public function test_provider_cannot_request_checkout_for_someone_elses_listing(): void
    {
        $owner = User::factory()->create();
        $owner->assignRole('provider');
        $listing = $this->makeListing($owner);

        $intruder = User::factory()->create();
        $intruder->assignRole('provider');
        Sanctum::actingAs($intruder);

        $this->postJson("/api/provider/listings/{$listing->id}/checkout")->assertNotFound();
    }

    public function test_provider_can_cancel_own_subscription(): void
    {
        Http::fake([
            'pay.flitt.com/api/checkout/url' => Http::response(['response' => ['checkout_url' => 'https://pay.flitt.com/x']]),
            'pay.flitt.com/api/subscription' => Http::response(['response' => ['status' => 'disabled']]),
        ]);

        $provider = User::factory()->create();
        $provider->assignRole('provider');
        Sanctum::actingAs($provider);

        $listing = $this->makeListing($provider);
        $this->postJson("/api/provider/listings/{$listing->id}/checkout")->assertOk();

        $this->postJson("/api/provider/listings/{$listing->id}/subscription/cancel")->assertOk();

        $this->assertSame('inactive', $listing->fresh()->status);
        $this->assertDatabaseHas('subscriptions', ['listing_id' => $listing->id, 'status' => 'cancelled']);
    }
}
