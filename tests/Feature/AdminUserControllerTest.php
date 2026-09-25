<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminUserControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
    }

    private function admin(): User
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        return $admin;
    }

    public function test_non_admin_cannot_list_users(): void
    {
        $provider = User::factory()->create();
        $provider->assignRole('provider');
        Sanctum::actingAs($provider);

        $this->getJson('/api/admin/users')->assertForbidden();
    }

    public function test_admin_can_list_users(): void
    {
        Sanctum::actingAs($this->admin());
        User::factory()->create()->assignRole('client');

        $response = $this->getJson('/api/admin/users')->assertOk();

        $this->assertGreaterThanOrEqual(2, count($response->json('users')));
    }

    public function test_admin_can_create_a_user_with_a_role(): void
    {
        Sanctum::actingAs($this->admin());

        $response = $this->postJson('/api/admin/users', [
            'name' => 'New Client',
            'email' => 'new-client@example.com',
            'password' => 'password123',
            'role' => 'client',
        ])->assertCreated();

        $this->assertSame('client', $response->json('role'));
        $this->assertDatabaseHas('users', ['email' => 'new-client@example.com']);
    }

    public function test_admin_can_update_a_users_role_and_password(): void
    {
        Sanctum::actingAs($this->admin());
        $user = User::factory()->create();
        $user->assignRole('client');

        $response = $this->putJson("/api/admin/users/{$user->id}", [
            'role' => 'provider',
            'password' => 'newpassword123',
        ])->assertOk();

        $this->assertSame('provider', $response->json('role'));
        $this->assertTrue(\Illuminate\Support\Facades\Hash::check('newpassword123', $user->fresh()->password));
    }

    public function test_admin_can_delete_another_user(): void
    {
        Sanctum::actingAs($this->admin());
        $user = User::factory()->create();
        $user->assignRole('client');

        $this->deleteJson("/api/admin/users/{$user->id}")->assertOk();

        $this->assertDatabaseMissing('users', ['id' => $user->id]);
    }

    public function test_admin_cannot_delete_their_own_account(): void
    {
        $admin = $this->admin();
        Sanctum::actingAs($admin);

        $this->deleteJson("/api/admin/users/{$admin->id}")->assertStatus(422);

        $this->assertDatabaseHas('users', ['id' => $admin->id]);
    }

    public function test_admin_cannot_delete_the_last_admin(): void
    {
        $admin = $this->admin();
        $otherAdmin = $this->admin();
        Sanctum::actingAs($admin);

        $this->deleteJson("/api/admin/users/{$otherAdmin->id}")->assertOk();
        $this->deleteJson("/api/admin/users/{$admin->id}")->assertStatus(422);

        $this->assertDatabaseHas('users', ['id' => $admin->id]);
    }
}
