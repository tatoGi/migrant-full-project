<?php

namespace Tests\Feature;

use App\Models\Listing;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VipListingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
    }

    public function test_homepage_vip_endpoint_returns_only_active_vip_listings(): void
    {
        $provider = User::factory()->create();
        $provider->assignRole('provider');

        $vipListing = Listing::create([
            'user_id' => $provider->id,
            'provider_name' => 'VIP Provider',
            'phone' => '+995555000000',
            'email' => 'vip@example.com',
            'nationality' => 'Georgian',
            'languages' => ['Georgian', 'English'],
            'profession' => 'Lawyer',
            'country' => 'Germany',
            'city' => 'Berlin',
            'description' => 'VIP listing',
            'listing_type' => 'vip',
            'price_type' => 'fixed',
            'price_value' => 100,
            'photos' => ['listings/1/vip.jpg'],
            'booking_mode' => 'request',
            'status' => 'active',
            'views_count' => 10,
        ]);

        Listing::create([
            'user_id' => $provider->id,
            'provider_name' => 'Standard Provider',
            'phone' => '+995555000001',
            'email' => 'standard@example.com',
            'nationality' => 'Georgian',
            'languages' => ['Georgian'],
            'profession' => 'Translator',
            'country' => 'Germany',
            'city' => 'Hamburg',
            'description' => 'Standard listing',
            'listing_type' => 'standard',
            'price_type' => 'fixed',
            'price_value' => 80,
            'photos' => ['listings/1/standard.jpg'],
            'booking_mode' => 'request',
            'status' => 'active',
            'views_count' => 2,
        ]);

        Listing::create([
            'user_id' => $provider->id,
            'provider_name' => 'Inactive VIP Provider',
            'phone' => '+995555000002',
            'email' => 'inactive-vip@example.com',
            'nationality' => 'Georgian',
            'languages' => ['Georgian'],
            'profession' => 'Consultant',
            'country' => 'Germany',
            'city' => 'Munich',
            'description' => 'Inactive VIP listing',
            'listing_type' => 'vip',
            'price_type' => 'fixed',
            'price_value' => 90,
            'photos' => ['listings/1/inactive-vip.jpg'],
            'booking_mode' => 'request',
            'status' => 'inactive',
            'views_count' => 1,
        ]);

        $this->getJson('/api/listings/vip')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonCount(1, 'listings')
            ->assertJsonPath('listings.0.id', $vipListing->id)
            ->assertJsonPath('listings.0.is_vip', true)
            ->assertJsonPath('listings.0.status', 'active');
    }
}
