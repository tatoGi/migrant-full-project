<?php

namespace Tests\Feature;

use App\Models\Listing;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ClientPanelTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
    }

    public function test_client_can_view_and_update_profile_settings(): void
    {
        $client = User::factory()->create();
        $client->assignRole('client');

        Sanctum::actingAs($client);

        $response = $this->putJson('/api/profile', [
            'first_name' => 'Nino',
            'last_name' => 'Beridze',
            'phone' => '+995555123456',
            'country' => 'Germany',
            'city' => 'Berlin',
            'nationality' => 'Georgian',
            'languages' => ['Georgian', 'English'],
            'notification_listing_updates' => true,
            'notification_new_messages' => false,
            'notification_promotions' => true,
        ]);

        $response->assertOk()
            ->assertJsonPath('first_name', 'Nino')
            ->assertJsonPath('notifications.new_messages', false);

        $this->getJson('/api/profile')
            ->assertOk()
            ->assertJsonPath('email', $client->email)
            ->assertJsonPath('notifications.listing_updates', true)
            ->assertJsonPath('notifications.promotions', true);
    }

    public function test_client_can_save_list_and_remove_saved_listings(): void
    {
        $client = User::factory()->create();
        $client->assignRole('client');

        $provider = User::factory()->create();
        $provider->assignRole('provider');

        $listing = Listing::create([
            'user_id' => $provider->id,
            'provider_name' => 'Provider One',
            'phone' => '+995555000000',
            'email' => 'provider@example.com',
            'nationality' => 'Georgian',
            'languages' => ['Georgian', 'English'],
            'profession' => 'Lawyer',
            'country' => 'Germany',
            'city' => 'Berlin',
            'description' => 'Test listing description',
            'listing_type' => 'vip',
            'price_type' => 'fixed',
            'price_value' => 120,
            'photos' => ['listings/1/photo.jpg'],
            'booking_mode' => 'request',
            'status' => 'active',
            'views_count' => 5,
        ]);

        Sanctum::actingAs($client);

        $this->postJson("/api/client/saved-listings/{$listing->id}")
            ->assertCreated()
            ->assertJsonPath('saved', true);

        $this->getJson('/api/client/saved-listings')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('saved_listings.0.id', $listing->id)
            ->assertJsonPath('saved_listings.0.provider_id', $provider->id)
            ->assertJsonPath('saved_listings.0.is_vip', true)
            ->assertJsonPath('saved_listings.0.photo', '/storage/listings/1/photo.jpg');

        $this->deleteJson("/api/client/saved-listings/{$listing->id}")
            ->assertOk()
            ->assertJsonPath('saved', false);

        $this->getJson('/api/client/saved-listings')
            ->assertOk()
            ->assertJsonPath('meta.total', 0);
    }

    public function test_provider_cannot_access_client_saved_listings_routes(): void
    {
        $provider = User::factory()->create();
        $provider->assignRole('provider');

        Sanctum::actingAs($provider);

        $this->getJson('/api/client/saved-listings')
            ->assertForbidden();
    }
}
