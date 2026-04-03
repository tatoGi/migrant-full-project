# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**Laravel 12 RESTful API backend** for Emigrant.GE — a Georgian emigrant services marketplace.
Pure API, no Blade views. Serves the Next.js frontend at `frontend/` (same repo).

**What the app does**: Emigrants abroad (providers) post service listings (lawyer, doctor, electrician…).
Local Georgians (clients) browse, filter, save, and book those services.

---

## Commands

```bash
npm run dev               # Start Vite + artisan serve + queue worker (concurrently)
php artisan serve         # Laravel only

php artisan migrate       # Run migrations
php artisan migrate:fresh # Drop all + re-run
php artisan db:seed       # Run seeders

php artisan test                                     # All tests
php artisan test tests/Feature/Auth/LoginTest.php   # Single file
php artisan test --filter=test_user_can_login        # Single test

vendor/bin/pint           # Fix code style
vendor/bin/pint --test    # Check without fixing

php artisan backup:run           # Full backup (DB + files)
php artisan backup:run --only-db # DB only
php artisan scout:import "App\Models\Listing"  # Fill MeiliSearch index
```

---

## Stack

| Package | Version | Role |
|---|---|---|
| `laravel/framework` | ^12.0 | Core framework |
| `laravel/sanctum` | ^4.3 | Token authentication |
| `spatie/laravel-permission` | ^7.2 | Role management |
| `spatie/laravel-query-builder` | ^6.4 | API filtering/sorting |
| `spatie/laravel-medialibrary` | ^11 | File/image uploads |
| `spatie/laravel-sluggable` | ^3 | SEO-friendly URL slugs |
| `spatie/laravel-activitylog` | ^4 | Audit trail |
| `spatie/laravel-data` | ^4 | Typed DTOs |
| `spatie/laravel-backup` | ^10 | DB + file backups |
| `spatie/laravel-rate-limited-job-middleware` | ^2 | Queue rate limiting |
| `laravel/scout` | ^11 | Full-text search driver |
| `meilisearch/meilisearch-php` | ^1 | MeiliSearch client |
| `intervention/image` | ^3 | Image resize/optimize |
| `propaganistas/laravel-phone` | ^6 | Phone number validation |
| `sentry/sentry-laravel` | ^4 | Error tracking (production) |
| `laravel/telescope` | ^5 (dev) | Debug dashboard (local) |
| `laravel/boost` | 2.0 (dev) | Dev tooling |
| `laravel/pint` | ^1.24 (dev) | Code style |

---

## Package Roadmap

### ✅ Priority 1 — დაყენებულია
- `spatie/laravel-medialibrary` — listing/profile images upload & management
- `spatie/laravel-sluggable` — SEO URLs (`/listings/giorgi-elektriki`)
- `spatie/laravel-activitylog` — user/admin actions audit trail
- `laravel/scout` + `meilisearch/meilisearch-php` — full-text search (Elasticsearch-ის ნაცვლად)

### ✅ Priority 2 — დაყენებულია
- `spatie/laravel-data` — Typed DTOs (`app/Data/StoreListingData.php`), `ListingService::store()` typed
- `laravel/horizon` — ❌ Windows `ext-pcntl` არ არის; production (Linux) server-ზე: `composer require laravel/horizon && php artisan horizon:install`
- `spatie/laravel-backup` — config published; `php artisan backup:run` / `backup:run --only-db`
- `intervention/image` — `UploadController` resize ≤1200px, JPEG 85%
- `propaganistas/laravel-phone` — `StoreListingRequest` + `UpdateProfileRequest` phone validation

### ✅ Priority 3 — დაყენებულია
- `sentry/sentry-laravel` — config published; `.env`-ში `SENTRY_LARAVEL_DSN=` შეავსე sentry.io-დან
- `laravel/telescope` — dev-only; dashboard: `http://localhost:8000/telescope`; gate: `admin` role-ი
- `spatie/laravel-rate-limited-job-middleware` — მაგალითი: `app/Jobs/SendNotificationJob.php` (30 req/min)

---

## Architecture: Repository → Service → Controller

ყველა feature ამ პატერნს მკაცრად მიყვება:

```
HTTP Request
    ↓
FormRequest          # validation + authorization (authorize() role check)
    ↓
Controller           # thin: calls Service, returns JsonResponse
    ↓
Service              # business logic, orchestration
    ↓
Repository           # all Eloquent queries, zero logic
    ↓
Model / Database
```

### ფაილ-სტრუქტურა

```
app/
├── Data/                          # Typed DTOs (spatie/laravel-data)
│   └── StoreListingData.php
├── Http/
│   ├── Controllers/Api/
│   │   ├── Admin/                 # admin-only controllers
│   │   │   ├── AdminListingController.php
│   │   │   ├── BannerController.php
│   │   │   └── SupportMessageController.php
│   │   ├── AuthController.php
│   │   ├── CategoryController.php
│   │   ├── ClientSavedListingController.php
│   │   ├── ListingController.php
│   │   ├── ProfileController.php
│   │   ├── ProviderSettingsController.php
│   │   ├── PublicListingController.php
│   │   └── UploadController.php
│   ├── Requests/
│   │   ├── Admin/
│   │   ├── Auth/
│   │   ├── Listing/
│   │   ├── Profile/
│   │   ├── Provider/
│   │   └── UploadTempPhotoRequest.php
│   └── Resources/
│       ├── CategoryResource.php
│       ├── ListingResource.php
│       ├── ProviderSettingsResource.php
│       ├── SiteSettingsResource.php
│       ├── SupportMessageResource.php
│       ├── UserProfileResource.php
│       └── UserResource.php
├── Jobs/
│   └── SendNotificationJob.php    # rate-limited job example
├── Models/
│   ├── Category.php
│   ├── Listing.php                # HasSlug, HasMedia, LogsActivity, Searchable
│   ├── ProviderSettings.php
│   ├── SavedListing.php
│   ├── SiteSettings.php
│   ├── SupportMessage.php
│   ├── User.php                   # HasApiTokens, HasRoles
│   └── UserProfile.php
├── Providers/
│   ├── AppServiceProvider.php
│   └── RepositoryServiceProvider.php  # binds Interface → Implementation
├── Repositories/
│   ├── Contracts/                 # interfaces
│   │   ├── ListingRepositoryInterface.php
│   │   ├── ProviderSettingsRepositoryInterface.php
│   │   ├── SavedListingRepositoryInterface.php
│   │   ├── UserProfileRepositoryInterface.php
│   │   └── UserRepositoryInterface.php
│   ├── ListingRepository.php
│   ├── ProviderSettingsRepository.php
│   ├── SavedListingRepository.php
│   ├── UserProfileRepository.php
│   └── UserRepository.php
└── Services/
    ├── AdminListingService.php
    ├── AuthService.php
    ├── BannerService.php
    ├── ListingService.php
    ├── ProfileService.php
    ├── ProviderSettingsService.php
    ├── SavedListingService.php
    └── SupportMessageService.php
```

### წესები (დარღვევა დაუშვებელია)
- **Controller**: inject Service-ი მხოლოდ, `$request->validated()` → Service, `return JsonResponse`
- **Service**: business logic; Repository-ს იძახებს; `array $data` ნაცვლად DTO-ს გამოიყენე
- **Repository**: Eloquent queries მხოლოდ; ლოგიკა არ შედის
- **RepositoryServiceProvider**: ყოველი ახალი Interface → Implementation bind-ი აქ

---

## Models და მათი კავშირები

### User
```
User
 ├── hasOne  → UserProfile       (სახელი, ტელეფონი, ქვეყანა, შეტყობინებები)
 ├── hasOne  → ProviderSettings  (provider-ის default პარამეტრები)
 ├── hasMany → Listing           (provider-ის განცხადებები)
 └── belongsToMany → Listing     (client-ის შენახული განცხადებები, saved_listings pivot)

Traits: HasApiTokens, HasRoles, HasFactory, Notifiable
```

### Listing
```
Listing
 └── belongsTo → User

Traits:
 ├── HasSlug          — auto-generates slug from provider_name + profession
 ├── InteractsWithMedia — photos media collection (spatie/medialibrary)
 ├── LogsActivity     — logs status/price/profession changes to activity_log
 └── Searchable       — Scout full-text index (only active listings)

Fields: slug, provider_name, phone, email, nationality, languages(json),
        profession, country, city, description, listing_type(standard/vip),
        price_type(fixed/hourly/negotiable), price_value, booking_mode,
        status(active/inactive), views_count
```

### UserProfile
```
Fields: first_name, last_name, phone, country, city, nationality,
        languages(json), notification_listing_updates, notification_new_messages,
        notification_promotions
```

### ProviderSettings
```
Fields: default_profession, default_price_type, default_price_value,
        service_mode, booking_mode, working_days(json), working_hours_start,
        working_hours_end, slot_duration_minutes,
        notify_bookings, notify_messages, notify_reviews, notify_promotions
```

---

## სრული Route Map

### Public (auth არ სჭირდება)
| Method | Route | Controller | აღწერა |
|---|---|---|---|
| GET | `/api/categories` | CategoryController@index | ყველა კატეგორია |
| GET | `/api/listings` | PublicListingController@index | Public listings + filters |
| GET | `/api/listings/vip` | ListingController@vip | VIP listings homepage-ისთვის |
| GET | `/api/listings/{slug}` | PublicListingController@show | Single listing by slug |

### Auth (`/api/auth/*`)
| Method | Route | Auth | აღწერა |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register + Sanctum token |
| POST | `/api/auth/login` | — | Login + Sanctum token |
| POST | `/api/auth/logout` | sanctum | Delete current token |
| GET | `/api/auth/me` | sanctum | Current user |
| PUT | `/api/auth/password` | sanctum | Change password |

### Shared (ნებისმიერი authenticated user)
| Method | Route | Auth | აღწერა |
|---|---|---|---|
| GET | `/api/profile` | sanctum | Get own profile |
| PUT | `/api/profile` | sanctum | Update own profile |
| POST | `/api/uploads/temp` | sanctum | Upload temp photo → returns token |

### Provider (`/api/provider/*`, role: provider)
| Method | Route | აღწერა |
|---|---|---|
| GET | `/api/provider/listings` | Own listings + stats |
| POST | `/api/provider/listings` | Create listing |
| PUT | `/api/provider/listings/{id}` | Update listing |
| DELETE | `/api/provider/listings/{id}` | Delete listing |
| POST | `/api/provider/listings/{id}/photos` | Upload photo to listing |
| DELETE | `/api/provider/listings/{id}/photos/{uuid}` | Remove photo by UUID |
| GET | `/api/provider/settings` | Get provider settings |
| PUT | `/api/provider/settings` | Update provider settings |

### Client (`/api/client/*`, role: client)
| Method | Route | აღწერა |
|---|---|---|
| GET | `/api/client/saved-listings` | Saved listings list |
| POST | `/api/client/saved-listings/{listingId}` | Save listing |
| DELETE | `/api/client/saved-listings/{listingId}` | Unsave listing |

### Admin (`/api/admin/*`, role: admin)
| Method | Route | აღწერა |
|---|---|---|
| GET | `/api/admin/listings?search=` | All listings + stats + search |
| PUT | `/api/admin/listings/{id}` | Update any listing |
| DELETE | `/api/admin/listings/{id}` | Delete any listing |
| GET | `/api/admin/support/messages` | All support conversations |
| GET | `/api/admin/support/messages/{conversationId}` | Single conversation |
| POST | `/api/admin/support/reply` | Reply to message |
| GET | `/api/admin/banner` | Get banner |
| POST | `/api/admin/banner` | Update banner |

---

## Data Flow — ძირითადი ოპერაციები

### 1. Listing შექმნა (3-step form)

```
Step 1+2: Frontend fills form (name, profession, languages, price…)
Step 3:   Frontend drag-drops photos
  → POST /api/uploads/temp   (each photo)
     UploadController: resize ≤1200px (intervention/image), save to storage/app/public/temp/{uuid}.jpg
     ← { token: "uuid", url: "/storage/temp/uuid.jpg" }

POST /api/provider/listings  { ...fields, photos: ["uuid1", "uuid2"] }
  → StoreListingRequest validates (phone: international format via laravel-phone)
  → Controller: StoreListingData::from($request->validated())
  → ListingService::store(User, StoreListingData):
      1. Create Listing (without photos)
      2. Slug auto-generated: "Giorgi Kvaratskhelia" + "Lawyer" → "giorgi-kvaratskhelia-lawyer"
      3. For each token: find temp/{uuid}.jpg → addMediaFromDisk → photos collection (medialibrary)
      4. Delete temp file
      5. ActivityLog: "created" event logged
  ← ListingResource { id, slug, photos: [{uuid, url}], ... }
```

### 2. Listing ძიება / ფილტრი

```
GET /api/listings?filter[profession]=lawyer&filter[city]=Berlin&filter[search]=giorgi&sort=-views_count

PublicListingController → ListingRepository::getPublicListings():
  QueryBuilder::for(Listing)
    .allowedFilters([profession, country, city, nationality, listing_type, language, search])
    .allowedSorts([created_at, views_count, price_value])
    .where(status=active)
    .paginate(12)

search filter: Listing::search($value)->keys() → Scout → collection driver (dev) / MeiliSearch (prod)
               whereIn(id, [...]) — SQL query with Scout IDs

← { data: [...], meta: { current_page, last_page, total } }
```

### 3. Photo წაშლა

```
DELETE /api/provider/listings/{id}/photos/{uuid}
  → ListingController::removePhoto(Request, int $id, string $uuid)
  → ListingService::removePhoto(Listing, string $uuid):
      $media = $listing->getMedia('photos')->firstWhere('uuid', $uuid)
      $media->delete()  ← MediaLibrary auto-deletes file from disk
  ← { message: "ფოტო წაიშალა.", photos: [...remaining] }
```

### 4. Auth Flow

```
POST /api/auth/register { name, email, password, password_confirmation, role }
  → RegisterRequest: validates role in:client,provider
  → AuthService::register():
      UserRepository::create() → User
      $user->assignRole($role)  (spatie/permission)
      $user->createToken('api')->plainTextToken  (sanctum)
  ← { user: UserResource, token: "..." }

All protected requests:
  Header: Authorization: Bearer {token}
  → Sanctum middleware validates token → injects $request->user()
```

---

## Roles

| Role | Registration | Access |
|---|---|---|
| `client` | `POST /api/auth/register` | profile, saved listings |
| `provider` | `POST /api/auth/register` | profile, own listings, settings |
| `admin` | manually via tinker | all admin routes, telescope |

```bash
# Admin role assign:
php artisan tinker
User::find(1)->assignRole('admin')
```

---

## Photo System (MediaLibrary)

ყველა ფოტო `media` ტაბულაში ინახება + disk-ზე `storage/app/public/` ქვეშ.

```php
// Photos response shape:
"photos": [
  { "uuid": "abc-123", "url": "http://localhost/storage/1/abc-123.jpg" },
  { "uuid": "def-456", "url": "http://localhost/storage/1/def-456.jpg" }
]
"photo": "http://localhost/storage/1/abc-123.jpg"  // first photo only
```

**temp upload flow**: `temp/{uuid}.jpg` → listing created → `addMediaFromDisk` → MediaLibrary manages permanently.
**direct upload** (after listing exists): `POST /api/provider/listings/{id}/photos` → `addMedia($file)`.
**delete**: by UUID — `DELETE /api/provider/listings/{id}/photos/{uuid}`.

---

## Search (Scout)

```bash
# Development (no server needed):
SCOUT_DRIVER=collection   # in-memory search

# Production (MeiliSearch):
SCOUT_DRIVER=meilisearch
MEILISEARCH_HOST=http://127.0.0.1:7700

php artisan scout:import "App\Models\Listing"  # initial index fill
```

Searchable fields: `provider_name`, `profession`, `city`, `country`, `description`, `nationality`, `languages`.
Only `status=active` listings are indexed (`shouldBeSearchable()`).
On create/update/delete → Scout auto-syncs index.

---

## Activity Log

`Listing` model-ი auto-logs-ს შემდეგ ცვლილებებს `activity_log` ტაბულაში:
`status`, `listing_type`, `profession`, `country`, `city`, `price_type`, `price_value`

- `logOnlyDirty()` — მხოლოდ შეცვლილი fields
- `dontSubmitEmptyLogs()` — ცარიელი log-ები არ ინახება

---

## Form Requests

- `authorize()` — role check (`$this->user()->hasRole('provider')`)
- `rules()` — Laravel validation array
- `messages()` — **Georgian** error messages (UI ქართულია)
- Phone validation: `(new Phone)->international()` — `+995555123456` format

---

## Adding a New Feature

1. `php artisan make:migration create_X_table`
2. `php artisan make:model X`
3. `app/Repositories/Contracts/XRepositoryInterface.php`
4. `app/Repositories/XRepository.php` implements interface
5. Bind in `RepositoryServiceProvider::register()`
6. `app/Data/StoreXData.php` (spatie/laravel-data DTO)
7. `app/Services/XService.php` — inject repository, accept DTO
8. `app/Http/Requests/X/StoreXRequest.php` — Georgian messages
9. `app/Http/Resources/XResource.php`
10. `app/Http/Controllers/Api/XController.php` — inject service only
11. `routes/api.php` — add routes under correct role middleware

---

## Database & Testing

- **DB**: MySQL (production). Tests: **SQLite in-memory** (`phpunit.xml`).
- Sessions, cache, queues: `database` driver.
- Tests: `tests/Feature/` and `tests/Unit/`.

---

## Debugging & Monitoring

| Tool | URL | Notes |
|---|---|---|
| Telescope | `http://localhost:8000/telescope` | dev-only; admin role gate |
| Sentry | sentry.io dashboard | set `SENTRY_LARAVEL_DSN` in `.env` |
| Backup | `storage/app/Laravel/` | `php artisan backup:run` |

---

## Frontend Integration

Frontend: `frontend/` — Next.js 16, axios, TanStack Query. (same repo, monorepo structure)

---

### Data Fetching — წესები

**ყველა API call** ამ ორ პატერნს მიყვება:

#### 1. Client Component — `useQuery` + `axios`

```tsx
// frontend/src/lib/api.ts — configured axios instance (Bearer token interceptor)
import api from "@/lib/api";

const { data } = useQuery({
  queryKey: ["listings"],
  queryFn: () => api.get("/listings").then((r) => r.data),
  staleTime: 60_000,
});
```

#### 2. Server Component (SSR) — `prefetchQuery` + `HydrationBoundary`

Server Component-ებში `useQuery` არ მუშაობს. SSR-ისთვის გამოიყენება React Query-ს prefetch pattern:

```tsx
// app/page.tsx (Server Component)
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export default async function Page() {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["site-settings"],
    queryFn: () => axios.get(`${API}/site-settings`).then((r) => r.data),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ClientComponent />   {/* useQuery-ს cache უკვე ავსებული აქვს */}
    </HydrationBoundary>
  );
}
```

**რატომ ეს pattern:**
- სერვერი data-ს fetch-ავს → `dehydrate` → HTML-ში serialize
- კლიენტი `HydrationBoundary`-ს cache-ს ავსებს — refetch **არ** კეთდება
- სურათი/ტექსტი პირველი render-იდანვე სწორია, loading flash არ არის
- `useQuery` Client Component-ებში უცვლელად მუშაობს

**დაუშვებელია:**
- `fetch()` API პირდაპირ — ყოველთვის `axios` ან `api` instance
- `useQuery` Server Component-ში
- raw `localStorage` — token მხოლოდ `api.ts` interceptor-ს იყენებს

---

### Auth Flow (დასრულებული)

- `frontend/src/contexts/AuthContext.tsx` — `signIn`, `signUp`, `signOut` რეალური API-ებია
- `signIn` / `signUp` აბრუნებს `{ error, role }` — redirect role-ის მიხედვით
- Token: `localStorage.auth_token` → `api.ts` interceptor-ი ამატებს `Authorization: Bearer`
- Session restore: mount-ზე `GET /api/auth/me` → token validation

---

**Key response shapes frontend expects:**

```json
// Listing
{
  "id": 1,
  "slug": "giorgi-kvaratskhelia-lawyer",
  "provider_name": "Giorgi Kvaratskhelia",
  "profession": "Lawyer",
  "city": "Berlin",
  "photos": [{ "uuid": "...", "url": "http://..." }],
  "photo": "http://...",
  "is_vip": false,
  "views_count": 42
}

// Auth
{ "user": { "id": 1, "name": "...", "email": "..." }, "token": "1|abc..." }
```
