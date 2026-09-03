# Flitt Provider Subscription Payments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gate new provider listings behind a monthly Flitt subscription payment (standard 5 GEL w/ 1-month trial, VIP 20 GEL) against sandbox merchant 153, driven end-to-end by Flitt's hosted checkout + native subscription engine and a signature-verified webhook.

**Architecture:** Repository → Service → Controller, matching the existing codebase. A new `FlittClient` wraps signed HTTP calls to `pay.flitt.com`. `SubscriptionService` owns plan pricing and status-transition logic; `SubscriptionRepository` is Eloquent-only. Listing creation becomes two-phase: create as `pending_payment`, flip to `active` only when Flitt's webhook confirms payment.

**Tech Stack:** Laravel 12, MySQL (prod) / SQLite (tests), Laravel `Http` facade, PHPUnit (`RefreshDatabase`, `Http::fake`, `Sanctum::actingAs`).

**Spec:** [docs/superpowers/specs/2026-09-03-flitt-provider-subscriptions-design.md](../specs/2026-09-03-flitt-provider-subscriptions-design.md)

## Global Constraints

- Sandbox only: `FLITT_MERCHANT_ID=153`, sandbox `FLITT_PAYMENT_KEY` from the Flitt merchant portal — never commit real key values, `.env.example` gets blank placeholders.
- Only the **payment key** is used for signatures. The "credit key" is out of scope — never read, stored, or referenced in code.
- Checkout is Flitt-hosted redirect (`/api/checkout/url`) — no embedded card form.
- No third-party Fondy/Flitt SDK — a small internal `FlittClient` only.
- Existing listings (created before this feature ships) are never touched by these migrations/services — they keep whatever `status` they already have (grandfathered for free).
- Georgian user-facing error messages, matching existing controllers (e.g. `'განცხადება ვერ მოიძებნა.'`).
- Follow the existing Repository → Service → Controller split; controllers stay thin (validate → call service → return `JsonResponse`).

---

## Task 1: Database schema — `subscriptions`, `subscription_events`, `listings.pending_payment`

**Files:**
- Create: `database/migrations/2026_09_03_120000_add_pending_payment_status_to_listings_table.php`
- Create: `database/migrations/2026_09_03_120100_create_subscriptions_table.php`
- Create: `database/migrations/2026_09_03_120200_create_subscription_events_table.php`
- Create: `app/Models/Subscription.php`
- Create: `app/Models/SubscriptionEvent.php`
- Test: `tests/Feature/SubscriptionModelTest.php`

**Interfaces:**
- Produces: `Subscription` (fillable: `listing_id, user_id, plan, amount, currency, flitt_order_id, flitt_payment_id, status, trial_ends_at, current_period_ends_at`; relations `listing(): BelongsTo`, `user(): BelongsTo`, `events(): HasMany`) and `SubscriptionEvent` (fillable: `subscription_id, flitt_payment_id, order_status, payload`; relation `subscription(): BelongsTo`). `listings.status` enum now includes `pending_payment`.

- [ ] **Step 1: Write the failing test**

```php
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --filter=SubscriptionModelTest`
Expected: FAIL — `SQLSTATE... no such table: subscriptions` (and `pending_payment` not a valid enum value yet).

- [ ] **Step 3: Write the migrations**

`database/migrations/2026_09_03_120000_add_pending_payment_status_to_listings_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('listings', function (Blueprint $table) {
            $table->enum('status', ['active', 'inactive', 'pending_payment'])->default('active')->change();
        });
    }

    public function down(): void
    {
        Schema::table('listings', function (Blueprint $table) {
            $table->enum('status', ['active', 'inactive'])->default('active')->change();
        });
    }
};
```

`database/migrations/2026_09_03_120100_create_subscriptions_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('listing_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('plan', ['standard', 'vip']);
            $table->unsignedInteger('amount');
            $table->string('currency', 3)->default('GEL');
            $table->string('flitt_order_id')->unique();
            $table->string('flitt_payment_id')->nullable();
            $table->enum('status', ['pending', 'trialing', 'active', 'past_due', 'cancelled'])->default('pending');
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('current_period_ends_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};
```

`database/migrations/2026_09_03_120200_create_subscription_events_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscription_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subscription_id')->constrained()->cascadeOnDelete();
            $table->string('flitt_payment_id')->nullable();
            $table->string('order_status');
            $table->json('payload');
            $table->timestamps();

            $table->unique(['subscription_id', 'flitt_payment_id', 'order_status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_events');
    }
};
```

- [ ] **Step 4: Write the models**

`app/Models/Subscription.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subscription extends Model
{
    use HasFactory;

    protected $fillable = [
        'listing_id',
        'user_id',
        'plan',
        'amount',
        'currency',
        'flitt_order_id',
        'flitt_payment_id',
        'status',
        'trial_ends_at',
        'current_period_ends_at',
    ];

    protected $casts = [
        'trial_ends_at' => 'datetime',
        'current_period_ends_at' => 'datetime',
    ];

    public function listing(): BelongsTo
    {
        return $this->belongsTo(Listing::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(SubscriptionEvent::class);
    }
}
```

`app/Models/SubscriptionEvent.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubscriptionEvent extends Model
{
    protected $fillable = [
        'subscription_id',
        'flitt_payment_id',
        'order_status',
        'payload',
    ];

    protected $casts = [
        'payload' => 'array',
    ];

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `php artisan test --filter=SubscriptionModelTest`
Expected: PASS (2 tests)

- [ ] **Step 6: Commit**

```bash
git add database/migrations/2026_09_03_120000_add_pending_payment_status_to_listings_table.php \
        database/migrations/2026_09_03_120100_create_subscriptions_table.php \
        database/migrations/2026_09_03_120200_create_subscription_events_table.php \
        app/Models/Subscription.php app/Models/SubscriptionEvent.php \
        tests/Feature/SubscriptionModelTest.php
git commit -m "feat: add subscriptions and subscription_events schema"
```

---

## Task 2: `SubscriptionRepository`

**Files:**
- Create: `app/Repositories/Contracts/SubscriptionRepositoryInterface.php`
- Create: `app/Repositories/SubscriptionRepository.php`
- Modify: `app/Providers/RepositoryServiceProvider.php`
- Test: `tests/Feature/SubscriptionRepositoryTest.php`

**Interfaces:**
- Consumes: `Subscription`, `SubscriptionEvent`, `Listing` models from Task 1.
- Produces: `SubscriptionRepositoryInterface` with `create(array $data): Subscription`, `update(Subscription $subscription, array $data): Subscription`, `findByOrderId(string $orderId): ?Subscription`, `findForListing(Listing $listing): ?Subscription`, `eventExists(int $subscriptionId, ?string $paymentId, string $orderStatus): bool`, `logEvent(int $subscriptionId, ?string $paymentId, string $orderStatus, array $payload): void`. These exact signatures are consumed by `SubscriptionService` in Task 4 and `SubscriptionController` in Task 7.

- [ ] **Step 1: Write the failing test**

```php
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --filter=SubscriptionRepositoryTest`
Expected: FAIL — `Target [App\Repositories\Contracts\SubscriptionRepositoryInterface] is not instantiable`

- [ ] **Step 3: Write the interface and implementation**

`app/Repositories/Contracts/SubscriptionRepositoryInterface.php`:

```php
<?php

namespace App\Repositories\Contracts;

use App\Models\Listing;
use App\Models\Subscription;

interface SubscriptionRepositoryInterface
{
    public function create(array $data): Subscription;

    public function update(Subscription $subscription, array $data): Subscription;

    public function findByOrderId(string $orderId): ?Subscription;

    public function findForListing(Listing $listing): ?Subscription;

    public function eventExists(int $subscriptionId, ?string $paymentId, string $orderStatus): bool;

    public function logEvent(int $subscriptionId, ?string $paymentId, string $orderStatus, array $payload): void;
}
```

`app/Repositories/SubscriptionRepository.php`:

```php
<?php

namespace App\Repositories;

use App\Models\Listing;
use App\Models\Subscription;
use App\Models\SubscriptionEvent;
use App\Repositories\Contracts\SubscriptionRepositoryInterface;

class SubscriptionRepository implements SubscriptionRepositoryInterface
{
    public function create(array $data): Subscription
    {
        return Subscription::create($data);
    }

    public function update(Subscription $subscription, array $data): Subscription
    {
        $subscription->update($data);

        return $subscription->fresh();
    }

    public function findByOrderId(string $orderId): ?Subscription
    {
        return Subscription::where('flitt_order_id', $orderId)->first();
    }

    public function findForListing(Listing $listing): ?Subscription
    {
        return Subscription::where('listing_id', $listing->id)->latest()->first();
    }

    public function eventExists(int $subscriptionId, ?string $paymentId, string $orderStatus): bool
    {
        return SubscriptionEvent::where('subscription_id', $subscriptionId)
            ->where('flitt_payment_id', $paymentId)
            ->where('order_status', $orderStatus)
            ->exists();
    }

    public function logEvent(int $subscriptionId, ?string $paymentId, string $orderStatus, array $payload): void
    {
        SubscriptionEvent::create([
            'subscription_id' => $subscriptionId,
            'flitt_payment_id' => $paymentId,
            'order_status' => $orderStatus,
            'payload' => $payload,
        ]);
    }
}
```

Modify `app/Providers/RepositoryServiceProvider.php` — add the import and bind line:

```php
use App\Repositories\Contracts\SubscriptionRepositoryInterface;
use App\Repositories\SubscriptionRepository;
```

```php
        $this->app->bind(SavedListingRepositoryInterface::class, SavedListingRepository::class);
        $this->app->bind(SubscriptionRepositoryInterface::class, SubscriptionRepository::class);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `php artisan test --filter=SubscriptionRepositoryTest`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add app/Repositories/Contracts/SubscriptionRepositoryInterface.php \
        app/Repositories/SubscriptionRepository.php \
        app/Providers/RepositoryServiceProvider.php \
        tests/Feature/SubscriptionRepositoryTest.php
git commit -m "feat: add SubscriptionRepository"
```

---

## Task 3: `FlittClient` — signed requests to Flitt

**Files:**
- Create: `config/flitt.php`
- Modify: `.env.example`
- Create: `app/Clients/FlittClient.php`
- Test: `tests/Feature/FlittClientTest.php`

**Interfaces:**
- Produces: `FlittClient::__construct(?string $baseUrl = null, ?int $merchantId = null, ?string $paymentKey = null)` (all params optional, defaulting to `config('flitt.*')` — so the container can autowire it with zero args), `createOrder(array $params): array` (returns the `response` object from `/checkout/url`, e.g. `['checkout_url' => ..., 'payment_id' => ..., 'response_status' => ...]`), `cancelSubscription(string $orderId): array`, `verifySignature(array $payload): bool`. Consumed by `SubscriptionService` (Task 4) and `FlittWebhookController` (Task 6).

- [ ] **Step 1: Write the failing test**

```php
<?php

namespace Tests\Feature;

use App\Clients\FlittClient;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class FlittClientTest extends TestCase
{
    private function client(): FlittClient
    {
        return new FlittClient('https://pay.flitt.com/api/', 1549901, 'test');
    }

    public function test_create_order_sends_request_signed_per_flitt_documented_example(): void
    {
        Http::fake([
            'pay.flitt.com/*' => Http::response([
                'response' => ['checkout_url' => 'https://pay.flitt.com/merchants/x', 'response_status' => 'success'],
            ]),
        ]);

        $client = $this->client();

        $result = $client->createOrder([
            'order_id' => 'TestOrder2',
            'amount' => 1000,
            'currency' => 'GEL',
            'order_desc' => 'Test payment',
            'server_callback_url' => 'http://myshop/callback/',
        ]);

        $this->assertSame('https://pay.flitt.com/merchants/x', $result['checkout_url']);

        $expectedSignature = sha1('test|1000|GEL|1549901|Test payment|TestOrder2|http://myshop/callback/');

        Http::assertSent(function ($request) use ($expectedSignature) {
            $body = $request->data()['request'];

            return $request->url() === 'https://pay.flitt.com/api/checkout/url'
                && $body['merchant_id'] === 1549901
                && $body['signature'] === $expectedSignature;
        });
    }

    public function test_cancel_subscription_sends_stop_action_to_subscription_endpoint(): void
    {
        Http::fake([
            'pay.flitt.com/*' => Http::response(['response' => ['status' => 'disabled']]),
        ]);

        $this->client()->cancelSubscription('order-abc');

        Http::assertSent(function ($request) {
            $body = $request->data()['request'];

            return $request->url() === 'https://pay.flitt.com/api/subscription'
                && $body['order_id'] === 'order-abc'
                && $body['action'] === 'stop';
        });
    }

    public function test_verify_signature_accepts_valid_and_rejects_tampered_payload(): void
    {
        $client = $this->client();

        $payload = [
            'amount' => 1000,
            'currency' => 'GEL',
            'merchant_id' => 1549901,
            'order_id' => 'TestOrder2',
            'order_status' => 'approved',
        ];
        $payload['signature'] = sha1('test|1000|GEL|1549901|TestOrder2|approved');

        $this->assertTrue($client->verifySignature($payload));

        $tampered = $payload;
        $tampered['amount'] = 9999;

        $this->assertFalse($client->verifySignature($tampered));
    }

    public function test_verify_signature_rejects_missing_signature(): void
    {
        $this->assertFalse($this->client()->verifySignature(['order_id' => 'x']));
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --filter=FlittClientTest`
Expected: FAIL — `Class "App\Clients\FlittClient" not found`

- [ ] **Step 3: Write the config and client**

`config/flitt.php`:

```php
<?php

return [
    'base_url' => env('FLITT_BASE_URL', 'https://pay.flitt.com/api/'),
    'merchant_id' => env('FLITT_MERCHANT_ID'),
    'payment_key' => env('FLITT_PAYMENT_KEY'),
];
```

Add to `.env.example` (blank placeholders, never real values):

```
FLITT_BASE_URL=https://pay.flitt.com/api/
FLITT_MERCHANT_ID=
FLITT_PAYMENT_KEY=
```

`app/Clients/FlittClient.php`:

```php
<?php

namespace App\Clients;

use Illuminate\Support\Facades\Http;

class FlittClient
{
    private string $baseUrl;

    private int $merchantId;

    private string $paymentKey;

    public function __construct(?string $baseUrl = null, ?int $merchantId = null, ?string $paymentKey = null)
    {
        $this->baseUrl = $baseUrl ?? config('flitt.base_url');
        $this->merchantId = $merchantId ?? (int) config('flitt.merchant_id');
        $this->paymentKey = $paymentKey ?? (string) config('flitt.payment_key');
    }

    public function createOrder(array $params): array
    {
        $response = Http::asJson()->post($this->baseUrl.'checkout/url', [
            'request' => $this->signedRequest($params),
        ]);

        return $response->json('response', []);
    }

    public function cancelSubscription(string $orderId): array
    {
        $response = Http::asJson()->post($this->baseUrl.'subscription', [
            'request' => $this->signedRequest([
                'order_id' => $orderId,
                'action' => 'stop',
            ]),
        ]);

        return $response->json('response', []);
    }

    public function verifySignature(array $payload): bool
    {
        $received = (string) ($payload['signature'] ?? '');

        if ($received === '') {
            return false;
        }

        return hash_equals($this->buildSignature($payload), $received);
    }

    private function signedRequest(array $params): array
    {
        $params['merchant_id'] = $this->merchantId;
        $params['signature'] = $this->buildSignature($params);

        return $params;
    }

    private function buildSignature(array $params): string
    {
        $scalarParams = array_filter(
            $params,
            fn ($value, $key) => $key !== 'signature' && $value !== null && $value !== '' && ! is_array($value),
            ARRAY_FILTER_USE_BOTH
        );

        ksort($scalarParams);

        $values = array_values($scalarParams);
        array_unshift($values, $this->paymentKey);

        return sha1(implode('|', $values));
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `php artisan test --filter=FlittClientTest`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add config/flitt.php .env.example app/Clients/FlittClient.php tests/Feature/FlittClientTest.php
git commit -m "feat: add FlittClient for signed requests to Flitt's API"
```

---

## Task 4: `SubscriptionService` — plan pricing, checkout, callback handling, cancellation

**Files:**
- Create: `app/Services/SubscriptionService.php`
- Test: `tests/Feature/SubscriptionServiceTest.php`

**Interfaces:**
- Consumes: `SubscriptionRepositoryInterface` (Task 2), `FlittClient` (Task 3), `Listing`, `Subscription` models.
- Produces: `createForListing(Listing $listing): array` (returns `['subscription' => Subscription, 'checkout_url' => string]`), `regenerateCheckout(Listing $listing, Subscription $subscription): string`, `cancel(Subscription $subscription): void`, `handleCallback(array $payload): void`. Consumed by `ListingController` (Task 5), `SubscriptionController` (Task 7), `FlittWebhookController` (Task 6).

- [ ] **Step 1: Write the failing test**

```php
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
            $body = $request->data()['request'];

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
            $body = $request->data()['request'];

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --filter=SubscriptionServiceTest`
Expected: FAIL — `Class "App\Services\SubscriptionService" not found`

- [ ] **Step 3: Write the service**

`app/Services/SubscriptionService.php`:

```php
<?php

namespace App\Services;

use App\Clients\FlittClient;
use App\Models\Listing;
use App\Models\Subscription;
use App\Repositories\Contracts\SubscriptionRepositoryInterface;
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
            'response_url' => rtrim(config('app.frontend_url'), '/')."/provider/listings/{$listing->id}",
        ]);

        return $response['checkout_url'] ?? '';
    }

    private function generateOrderId(Listing $listing): string
    {
        return "listing-{$listing->id}-".Str::random(10);
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `php artisan test --filter=SubscriptionServiceTest`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add app/Services/SubscriptionService.php tests/Feature/SubscriptionServiceTest.php
git commit -m "feat: add SubscriptionService for Flitt checkout and callback handling"
```

---

## Task 5: Gate listing creation behind payment

**Files:**
- Modify: `app/Services/ListingService.php:42-80` (the `store` method)
- Modify: `app/Http/Controllers/Api/ListingController.php:16-62` (constructor + `store`)
- Test: `tests/Feature/ProviderListingPaymentTest.php`

**Interfaces:**
- Consumes: `SubscriptionService::createForListing(Listing $listing): array` (Task 4).
- Produces: `POST /api/provider/listings` now responds `{ "listing": {...}, "checkout_url": "..." }` instead of the bare `ListingResource`. New listings are created with `status = pending_payment`.

- [ ] **Step 1: Write the failing test**

```php
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --filter=ProviderListingPaymentTest`
Expected: FAIL — `listing.status` is `active`, `checkout_url` key missing.

- [ ] **Step 3: Modify `ListingService::store`**

In `app/Services/ListingService.php`, inside `store()`, add `'status' => 'pending_payment'` to the `create()` array (right after `'booking_mode' => $data->booking_mode,`):

```php
        $listing = $this->listingRepository->create([
            'user_id' => $user->id,
            'provider_name' => $data->provider_name,
            'phone' => $data->phone,
            'email' => $data->email,
            'nationality' => $data->nationality,
            'languages' => $data->languages,
            'profession' => $data->profession,
            'country' => $data->country,
            'city' => $data->city,
            'description' => $data->description,
            'listing_type' => $data->listing_type,
            'price_type' => $data->price_type,
            'price_value' => $data->price_value,
            'booking_mode' => $data->booking_mode,
            'status' => 'pending_payment',
        ]);
```

- [ ] **Step 4: Modify `ListingController`**

In `app/Http/Controllers/Api/ListingController.php`, add the `SubscriptionService` dependency and update `store()`:

```php
use App\Services\SubscriptionService;
```

```php
    public function __construct(
        private readonly ListingService $listingService,
        private readonly ListingRepositoryInterface $listingRepository,
        private readonly SubscriptionService $subscriptionService,
    ) {}
```

```php
    // POST /api/provider/listings
    public function store(StoreListingRequest $request): JsonResponse
    {
        $listing = $this->listingService->store(
            $request->user(),
            StoreListingData::from($request->validated())
        );

        $payment = $this->subscriptionService->createForListing($listing);

        return response()->json([
            'listing' => new ListingResource($listing),
            'checkout_url' => $payment['checkout_url'],
        ], 201);
    }
```

- [ ] **Step 5: Run test to verify it passes**

Run: `php artisan test --filter=ProviderListingPaymentTest`
Expected: PASS (1 test)

- [ ] **Step 6: Run the full existing suite to check for regressions**

Run: `php artisan test`
Expected: PASS — no other test asserts the old bare-`ListingResource` shape from `store()` (confirm by reading failures, if any, and fixing the asserting test to match the new `{ listing, checkout_url }` shape).

- [ ] **Step 7: Commit**

```bash
git add app/Services/ListingService.php app/Http/Controllers/Api/ListingController.php \
        tests/Feature/ProviderListingPaymentTest.php
git commit -m "feat: gate new listings behind Flitt payment"
```

---

## Task 6: `FlittWebhookController` — signature-verified callback endpoint

**Files:**
- Create: `app/Http/Controllers/Api/FlittWebhookController.php`
- Modify: `routes/api.php`
- Test: `tests/Feature/FlittWebhookTest.php`

**Interfaces:**
- Consumes: `FlittClient::verifySignature(array $payload): bool` (Task 3), `SubscriptionService::handleCallback(array $payload): void` (Task 4).
- Produces: `POST /api/webhooks/flitt` (no auth middleware — verified by signature instead).

- [ ] **Step 1: Write the failing test**

```php
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --filter=FlittWebhookTest`
Expected: FAIL — `404 Not Found` (route doesn't exist yet).

- [ ] **Step 3: Write the controller**

`app/Http/Controllers/Api/FlittWebhookController.php`:

```php
<?php

namespace App\Http\Controllers\Api;

use App\Clients\FlittClient;
use App\Http\Controllers\Controller;
use App\Services\SubscriptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FlittWebhookController extends Controller
{
    public function __construct(
        private readonly FlittClient $flitt,
        private readonly SubscriptionService $subscriptionService,
    ) {}

    public function handle(Request $request): JsonResponse
    {
        $payload = $request->input('response', $request->all());

        if (! $this->flitt->verifySignature($payload)) {
            return response()->json(['message' => 'invalid signature'], 401);
        }

        $this->subscriptionService->handleCallback($payload);

        return response()->json(['message' => 'ok']);
    }
}
```

- [ ] **Step 4: Add the route**

In `routes/api.php`, add the import and route with the other public routes (top of the file):

```php
use App\Http\Controllers\Api\FlittWebhookController;
```

```php
Route::get('listings/{slug}', [PublicListingController::class, 'show']);
Route::post('webhooks/flitt', [FlittWebhookController::class, 'handle']);
```

- [ ] **Step 5: Run test to verify it passes**

Run: `php artisan test --filter=FlittWebhookTest`
Expected: PASS (4 tests)

- [ ] **Step 6: Commit**

```bash
git add app/Http/Controllers/Api/FlittWebhookController.php routes/api.php tests/Feature/FlittWebhookTest.php
git commit -m "feat: add signature-verified Flitt webhook endpoint"
```

---

## Task 7: `SubscriptionController` — retry checkout and cancel

**Files:**
- Create: `app/Http/Controllers/Api/SubscriptionController.php`
- Modify: `routes/api.php`
- Test: `tests/Feature/SubscriptionControllerTest.php`

**Interfaces:**
- Consumes: `SubscriptionService::createForListing`, `regenerateCheckout`, `cancel` (Task 4); `SubscriptionRepositoryInterface::findForListing` (Task 2); `ListingRepositoryInterface::findById` (existing).
- Produces: `POST /api/provider/listings/{id}/checkout` → `{ "checkout_url": "..." }`; `POST /api/provider/listings/{id}/subscription/cancel` → `{ "message": "..." }`.

- [ ] **Step 1: Write the failing test**

```php
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --filter=SubscriptionControllerTest`
Expected: FAIL — `404 Not Found` (routes don't exist yet).

- [ ] **Step 3: Write the controller**

`app/Http/Controllers/Api/SubscriptionController.php`:

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Repositories\Contracts\ListingRepositoryInterface;
use App\Repositories\Contracts\SubscriptionRepositoryInterface;
use App\Services\SubscriptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    public function __construct(
        private readonly SubscriptionService $subscriptionService,
        private readonly SubscriptionRepositoryInterface $subscriptions,
        private readonly ListingRepositoryInterface $listings,
    ) {}

    public function checkout(Request $request, int $id): JsonResponse
    {
        $listing = $this->listings->findById($id);

        if (! $listing || $listing->user_id !== $request->user()->id) {
            return response()->json(['message' => 'განცხადება ვერ მოიძებნა.'], 404);
        }

        $subscription = $this->subscriptions->findForListing($listing);

        $checkoutUrl = $subscription
            ? $this->subscriptionService->regenerateCheckout($listing, $subscription)
            : $this->subscriptionService->createForListing($listing)['checkout_url'];

        return response()->json(['checkout_url' => $checkoutUrl]);
    }

    public function cancel(Request $request, int $id): JsonResponse
    {
        $listing = $this->listings->findById($id);

        if (! $listing || $listing->user_id !== $request->user()->id) {
            return response()->json(['message' => 'განცხადება ვერ მოიძებნა.'], 404);
        }

        $subscription = $this->subscriptions->findForListing($listing);

        if (! $subscription) {
            return response()->json(['message' => 'გამოწერა ვერ მოიძებნა.'], 404);
        }

        $this->subscriptionService->cancel($subscription);

        return response()->json(['message' => 'გამოწერა გაუქმდა.']);
    }
}
```

- [ ] **Step 4: Add the routes**

In `routes/api.php`, add the import and routes inside the provider group:

```php
use App\Http\Controllers\Api\SubscriptionController;
```

```php
Route::middleware(['auth:sanctum', 'role:provider'])->prefix('provider')->group(function () {
    Route::get('listings', [ListingController::class, 'index']);
    Route::post('listings', [ListingController::class, 'store']);
    Route::put('listings/{id}', [ListingController::class, 'update']);
    Route::delete('listings/{id}', [ListingController::class, 'destroy']);
    Route::post('listings/{id}/photos', [ListingController::class, 'uploadPhoto']);
    Route::delete('listings/{id}/photos/{uuid}', [ListingController::class, 'removePhoto']);
    Route::post('listings/{id}/checkout', [SubscriptionController::class, 'checkout']);
    Route::post('listings/{id}/subscription/cancel', [SubscriptionController::class, 'cancel']);

    Route::get('settings', [ProviderSettingsController::class, 'show']);
    Route::put('settings', [ProviderSettingsController::class, 'update']);
});
```

- [ ] **Step 5: Run test to verify it passes**

Run: `php artisan test --filter=SubscriptionControllerTest`
Expected: PASS (3 tests)

- [ ] **Step 6: Commit**

```bash
git add app/Http/Controllers/Api/SubscriptionController.php routes/api.php tests/Feature/SubscriptionControllerTest.php
git commit -m "feat: add checkout retry and subscription cancel endpoints"
```

---

## Task 8: Full regression run + sandbox smoke test

**Files:**
- None created — verification only.

**Interfaces:**
- None (this task consumes the entire feature to confirm it works end-to-end, both automated and manually against the live sandbox).

- [ ] **Step 1: Run the full automated test suite**

Run: `php artisan test`
Expected: All tests pass (existing suite + all tests added in Tasks 1-7). If anything unrelated regressed, fix it before proceeding — do not skip failing tests.

- [ ] **Step 2: Fill in real sandbox credentials**

In your local `.env` (not committed):

```
FLITT_MERCHANT_ID=153
FLITT_PAYMENT_KEY=<the sandbox payment key from the Flitt merchant portal>
FLITT_BASE_URL=https://pay.flitt.com/api/
```

Run `php artisan migrate` to apply the new tables/enum locally against your real dev database.

- [ ] **Step 3: Manual sandbox walkthrough**

1. As a `provider` user, `POST /api/provider/listings` with `listing_type: standard` — confirm the response has `listing.status = pending_payment` and a real `checkout_url` pointing at `pay.flitt.com`.
2. Open `checkout_url` in a browser, pay with one of Flitt's documented sandbox test cards (`https://docs.flitt.com/getting-started/testing/`).
3. Confirm your local server actually receives the callback at `/api/webhooks/flitt` — sandbox needs a publicly reachable URL, so tunnel your local server first (e.g. `php artisan serve` behind an existing tunneling tool already used in this project, or ngrok) and set `APP_URL` to that tunnel URL before creating the listing so `server_callback_url` resolves.
4. Confirm the listing flips to `active` (`GET /api/provider/listings`) and a `subscriptions` row exists with `status = trialing` and a set `trial_ends_at` (standard plan trial).
5. Repeat with `listing_type: vip` — confirm `status = active` immediately (no `trialing` step) since VIP has no trial.
6. Call `POST /api/provider/listings/{id}/subscription/cancel` — confirm the sandbox subscription is stopped and the listing becomes `inactive`.
7. Trigger a decline (Flitt's docs list a specific test card number for forced declines) and confirm the listing goes `inactive` and `subscriptions.status = past_due`.

- [ ] **Step 4: Record findings**

If sandbox behavior differs from what Task 4's `applyStatusTransition` assumes (e.g. Flitt sends `order_status: processing` before `approved` for the trial start, or the webhook payload is wrapped differently than `$request->all()`), fix `SubscriptionService`/`FlittWebhookController` to match reality, add a regression test capturing the real payload shape, and re-run Step 1.

- [ ] **Step 5: Commit any sandbox-driven fixes**

```bash
git add -A
git commit -m "fix: adjust Flitt callback handling to match sandbox 153 behavior"
```

(Skip this step if Step 3 required no code changes.)

---

## Self-Review Notes

- **Spec coverage:** every section of the design spec maps to a task — schema (Task 1), repository (Task 2), signed client (Task 3), plan pricing/status machine (Task 4), payment gate on listing creation (Task 5), webhook (Task 6), retry/cancel endpoints (Task 7), sandbox verification (Task 8).
- **Activity log correctness:** `SubscriptionService` updates `$subscription->listing->update([...])` (the loaded model instance), not `$subscription->listing()->update([...])` (the relation's query builder) — the latter would bypass Eloquent model events and silently break `Listing`'s existing `LogsActivity` audit trail on `status` changes.
- **Type consistency checked:** `SubscriptionRepositoryInterface` method names/signatures in Task 2 match every call site in Tasks 4 and 7 exactly (`findForListing`, `findByOrderId`, `eventExists`, `logEvent`, `create`, `update`). `FlittClient` method names in Task 3 (`createOrder`, `cancelSubscription`, `verifySignature`) match all call sites in Tasks 4 and 6.
- **Out of scope, confirmed matching the spec:** production credentials, the "credit key", embedded card form, grace periods, retroactive billing, and any frontend changes (redirect handling, cancel-subscription UI) — the spec's Architecture section only covers `app/`, so frontend wiring is a follow-up plan, not part of this one.
