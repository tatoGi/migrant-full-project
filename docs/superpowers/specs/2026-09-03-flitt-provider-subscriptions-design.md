# Flitt (Tpay/TBC) Provider Subscription Payments — Design

## Context

Emigrant.GE providers currently create listings for free. We're introducing paid
monthly listings via **Flitt** (flitt.com, formerly Fondy) — the payment gateway
provided under merchant #153 (sandbox), issued by TPAY LLC and powered by TBC Bank.
Flitt's REST API is used directly (signed requests, SHA1 HMAC-style signature over
sorted params) — no third-party SDK.

Plans (per-listing, chosen at creation):

- **standard** — 5 GEL / month, first month free (trial)
- **vip** — 20 GEL / month, no trial

Billing is monthly and recurring, using Flitt's native **Subscriptions** feature
(`subscription=Y` + `recurring_data` on the checkout request) — Flitt owns the
recurring schedule; we don't run our own re-charge cron.

Scope of this design: **sandbox merchant 153 only**. Production merchant credentials
will reuse the same code path via different env vars once sandbox is verified.

## Business rules (confirmed with user)

- New listings are created as `pending_payment` and only flip to `active` after a
  successful Flitt callback confirms payment/subscription start.
- Listings that existed **before** this feature ships are grandfathered: they stay
  `active` and are never required to pay retroactively.
- If a recurring charge fails, or the provider cancels the subscription, the listing
  immediately goes to `inactive`. No grace period.
- Only the **payment key** (Flitt's secret/payment key) is used, for signature
  building. The "credit key" Flitt also issued is for a different product (e.g.
  TBC installments/BNPL) and is out of scope — not stored or used.
- Checkout is **Flitt-hosted redirect** (`/api/checkout/url`), not an embedded card
  form. PCI scope stays off our servers.

## Flow

```
1. POST /api/provider/listings
   -> Listing created, status = pending_payment
   -> Subscription row created, status = pending
   -> SubscriptionService builds a signed Flitt order+subscription request
      (subscription=Y, recurring_data{period=month, every=1,
       trial_period/trial_quantity for standard plan})
   -> Response includes { listing, checkout_url }
   -> Frontend redirects provider's browser to checkout_url

2. Provider pays on Flitt's hosted page (card details never touch our servers)

3. Flitt POSTs to server_callback_url = /api/webhooks/flitt
   -> FlittWebhookController verifies signature (recompute SHA1, reject on mismatch)
   -> Raw payload stored in subscription_events (idempotent on flitt_payment_id)
   -> SubscriptionService maps order_status -> subscription.status:
        approved/processing (first charge or trial start) -> trialing|active
                                                               listing.status = active
        declined/expired                                   -> past_due
                                                               listing.status = inactive
        reversed (cancellation confirmed)                   -> cancelled
                                                               listing.status = inactive

4. Retry path: POST /api/provider/listings/{id}/checkout
   -> regenerates a fresh checkout_url (old one expired ~10h, or was declined)

5. Cancel path: POST /api/provider/listings/{id}/subscription/cancel
   -> calls Flitt "Cancel subscription" API
   -> subscription.status = cancelled, listing.status = inactive
```

## Data model

### `subscriptions` table

| column | type | notes |
|---|---|---|
| id | bigint pk | |
| listing_id | fk -> listings.id | one active subscription per listing |
| user_id | fk -> users.id | the provider, denormalized for quick lookup |
| plan | enum(standard, vip) | |
| amount | integer | tetri (500 or 2000) |
| currency | string(3) | default `GEL` |
| flitt_order_id | string, unique | our generated order_id sent to Flitt |
| flitt_payment_id | string, nullable | Flitt's payment_id once known |
| status | enum(pending, trialing, active, past_due, cancelled) | |
| trial_ends_at | timestamp, nullable | standard plan only |
| current_period_ends_at | timestamp, nullable | informational, Flitt owns the real schedule |
| timestamps | | |

### `subscription_events` table

Append-only audit log of every webhook payload.

| column | type | notes |
|---|---|---|
| id | bigint pk | |
| subscription_id | fk -> subscriptions.id | |
| flitt_payment_id | string | |
| order_status | string | raw value from Flitt |
| payload | json | full raw callback body |
| created_at | | |

Unique constraint on (`subscription_id`, `flitt_payment_id`, `order_status`) gives
idempotency against duplicate webhook deliveries.

## Architecture (Repository → Service → Controller, existing pattern)

```
app/
├── Clients/
│   └── FlittClient.php               # builds signed requests, calls pay.flitt.com
├── Models/
│   ├── Subscription.php
│   └── SubscriptionEvent.php
├── Repositories/
│   ├── Contracts/SubscriptionRepositoryInterface.php
│   └── SubscriptionRepository.php
├── Services/
│   └── SubscriptionService.php       # plan -> amount/trial mapping, status transitions
├── Http/
│   ├── Controllers/Api/
│   │   ├── SubscriptionController.php     # checkout + cancel endpoints
│   │   └── FlittWebhookController.php     # public callback endpoint
│   └── Requests/... (as needed)
└── config/flitt.php                  # merchant_id, payment_key, base_url from env
```

`RepositoryServiceProvider` gets the new interface binding.

## Routes

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/api/provider/listings` | sanctum, role:provider | existing route, modified: creates `pending_payment` listing + subscription, returns `checkout_url` |
| POST | `/api/provider/listings/{id}/checkout` | sanctum, role:provider | regenerate checkout_url |
| POST | `/api/provider/listings/{id}/subscription/cancel` | sanctum, role:provider | cancel subscription |
| POST | `/api/webhooks/flitt` | none (signature-verified) | Flitt server callback |

## Config

`config/flitt.php`:
```php
return [
    'merchant_id' => env('FLITT_MERCHANT_ID'),
    'payment_key' => env('FLITT_PAYMENT_KEY'),
    'base_url'    => env('FLITT_BASE_URL', 'https://pay.flitt.com/api/'),
];
```

`.env` (sandbox):
```
FLITT_MERCHANT_ID=153
FLITT_PAYMENT_KEY=<test payment key from Flitt merchant portal>
FLITT_BASE_URL=https://pay.flitt.com/api/
```

Secrets are never committed; `.env.example` gets placeholder keys only.

## Testing

- Feature tests using `Http::fake()` against `pay.flitt.com/api/checkout/url` and
  `.../subscriptions/*` — assert the signed request shape (sorted params, correct
  SHA1) and that a `pending_payment` listing + `pending` subscription are created.
- Webhook tests: valid signature → status transitions correctly; invalid signature →
  rejected (422/401), no state change; duplicate `flitt_payment_id` → no double
  processing.
- Manual sandbox run against merchant 153 with Flitt's documented test cards before
  calling this done.

## Out of scope (explicitly, for this iteration)

- Production merchant credentials/activation.
- The "credit key" / TBC installment product.
- Embedded card form (Flitt JS SDK) — hosted redirect only.
- Grace period on failed/cancelled payments.
- Retroactive billing of listings that existed before this feature.
