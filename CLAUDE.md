# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Laravel 12 RESTful API backend** for Emigrant.GE — a Georgian emigrant services marketplace. Pure API, no Blade views. Serves the Next.js frontend at `C:\Users\pc\Desktop\tato\emigrant-next`.

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
```

---

## Stack

| Package | Version | Role |
|---|---|---|
| `laravel/framework` | ^12.0 | Core framework |
| `laravel/sanctum` | ^4.3 | Token authentication |
| `spatie/laravel-permission` | ^7.2 | Role management |
| `laravel/boost` | 2.0 (dev) | Dev tooling |
| `laravel/pint` | ^1.24 (dev) | Code style |

> **Not yet installed** (planned): `spatie/laravel-query-builder`, Elasticsearch.

---

## Architecture: Repository → Service → Controller

Every feature follows this pattern strictly:

```
app/
├── Http/
│   ├── Controllers/Api/     # Thin — only calls Service, returns JSON
│   ├── Requests/{Resource}/ # Form Requests — validation + authorization
│   └── Resources/           # API Resources — JSON shape
├── Services/                # Business logic — calls Repository
├── Repositories/
│   ├── Contracts/           # Interfaces
│   └── {Model}Repository.php
├── Models/
└── Providers/
    └── RepositoryServiceProvider.php  # Binds Interface → Implementation
```

**Rules:**
- Controllers: only inject Service, call it with `$request->validated()`, return `JsonResponse`
- Services: business logic only, call Repository methods
- Repositories: all Eloquent queries, no logic
- Always bind `Interface → Implementation` in `RepositoryServiceProvider`

---

## What's Built

### Auth (`/api/auth/*`)

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register, assign role, return Sanctum token |
| POST | `/api/auth/login` | — | Login, return Sanctum token |
| POST | `/api/auth/logout` | `auth:sanctum` | Delete current token |
| GET | `/api/auth/me` | `auth:sanctum` | Return current user |

**Token flow**: All protected routes use `middleware('auth:sanctum')`. Frontend must send `Authorization: Bearer {token}`.

**Roles**: `client`, `provider` (registerable). `admin` assigned manually. `role` field validated as `in:client,provider` in `RegisterRequest`.

**Response shape** (from `UserResource`):
```json
{ "user": { "id": 1, "name": "...", "email": "..." }, "token": "..." }
```

### Models
- `User` — uses `HasApiTokens` (Sanctum), `HasRoles` (Spatie), `HasFactory`, `Notifiable`

### Repositories
- `UserRepositoryInterface` → `UserRepository`: `create(array): User`, `findByEmail(string): ?User`

---

## Form Requests

Stored in `app/Http/Requests/{Resource}/`. Example: `Auth/RegisterRequest.php`.

- `authorize()` — role/permission check (not in Controller)
- `rules()` — standard Laravel array syntax
- `messages()` — **Georgian** error messages (UI language is Georgian)

```php
public function messages(): array
{
    return [
        'email.required' => 'ელ-ფოსტა სავალდებულოა.',
        'email.unique'   => 'ეს ელ-ფოსტა უკვე რეგისტრირებულია.',
    ];
}
```

---

## Adding a New Feature (e.g. Listings)

1. Migration → `php artisan make:migration create_listings_table`
2. Model → `php artisan make:model Listing`
3. Interface → `app/Repositories/Contracts/ListingRepositoryInterface.php`
4. Repository → `app/Repositories/ListingRepository.php` (implements interface)
5. Bind in `RepositoryServiceProvider::register()`
6. Service → `app/Services/ListingService.php` (inject repository via constructor)
7. Form Requests → `app/Http/Requests/Listing/StoreListingRequest.php`, etc.
8. Resource → `app/Http/Resources/ListingResource.php`
9. Controller → `app/Http/Controllers/Api/ListingController.php` (inject service)
10. Routes → `routes/api.php`

---

## Database & Testing

- **DB**: MySQL (production). Tests use **SQLite in-memory** (configured in `phpunit.xml`).
- Sessions, cache, queues: database driver.
- Tests live in `tests/Feature/` and `tests/Unit/`.

---

## Frontend Integration

Frontend: `C:\Users\pc\Desktop\tato\emigrant-next` (Next.js 16, axios, TanStack Query).

Frontend `AuthContext` has these TODOs to replace with real API calls:
- `signIn` → `POST /api/auth/login`
- `signUp` → `POST /api/auth/register` (send `name`, `email`, `password`, `password_confirmation`, `role`)
- `signOut` → `POST /api/auth/logout` (Bearer token)
- `resetPassword` → `POST /api/auth/forgot-password` (not yet built in backend)

Frontend middleware (`src/proxy.ts`) is stubbed — needs to validate the Sanctum token when backend is ready.
