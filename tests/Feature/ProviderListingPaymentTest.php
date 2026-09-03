<?php

namespace Tests\Feature;

use App\Models\Subscription;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProviderListingPaymentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        config(['flitt.merchant_id' => 153, 'flitt.payment_key' => 'test-secret']);
    }

    public function test_creating_a_listing_starts_it_pending_payment_and_returns_checkout_url(): void
    {
        Http::fake([
            'pay.flitt.com/*' => Http::response(['response' => ['checkout_url' => 'https://pay.flitt.com/x']]),
        ]);

        $provider = User::factory()->create();
        $provider->assignRole('provider');
        Sanctum::actingAs($provider);

        $response = $this->postJson('/api/provider/listings', [
            'provider_name' => 'Giorgi Kvaratskhelia',
            'phone' => '+995555123456',
            'nationality' => 'Georgian',
            'languages' => ['Georgian'],
            'profession' => 'Lawyer',
            'country' => 'Germany',
            'city' => ['Berlin'],
            'description' => 'Experienced lawyer helping emigrants abroad.',
            'listing_type' => 'standard',
            'price_type' => 'fixed',
            'price_value' => 100,
        ]);

        $response->assertCreated()
            ->assertJsonPath('checkout_url', 'https://pay.flitt.com/x')
            ->assertJsonPath('listing.status', 'pending_payment');

        $this->assertDatabaseHas('subscriptions', [
            'user_id' => $provider->id,
            'plan' => 'standard',
            'amount' => 500,
            'status' => 'pending',
        ]);
    }
}
