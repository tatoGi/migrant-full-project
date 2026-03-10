# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **Laravel 12 RESTful API backend** for an emigrant/migrant services platform, built with **Laravel Boost**. It serves the Next.js frontend located at `C:\Users\pc\Desktop\tato\emigrant-next`. There are no Blade views used for the application — this is a pure API backend.

The frontend communicates via `axios` + TanStack Query. All routes should live in `routes/api.php`. The frontend expects these endpoint patterns (from its TODO comments):
- `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/logout`, `POST /api/auth/forgot-password`
- `GET /api/listings`, `POST /api/listings`, `PUT /api/listings/{id}`, `DELETE /api/listings/{id}`

User roles: `client`, `provider`, `admin`.

---

## Laravel Backend Commands

### Development
```bash
npm run dev          # Start Vite + artisan serve + queue worker concurrently
php artisan serve    # Laravel backend only
```

### Testing
```bash
php artisan test                               # Run all tests
php artisan test tests/Feature/FooTest.php    # Run a single test file
php artisan test --filter=test_method_name    # Run a specific test method
```

### Code Style
```bash
vendor/bin/pint        # Fix PHP code style (Laravel Pint)
vendor/bin/pint --test # Check without fixing
```

### Database
```bash
php artisan migrate           # Run migrations
php artisan migrate:fresh     # Drop all tables and re-run
php artisan db:seed           # Run seeders
```

---

## Laravel Architecture

**Stack**: Laravel 12 (PHP ^8.2) + Laravel Boost

**Key packages**:
- **spatie/laravel-query-builder** — filter, sort, and include relations via query params (`?filter[field]=value&sort=field&include=relation`)
- **spatie/laravel-permission** — role & permission management. Roles: `client`, `provider`, `admin`. Use `$user->assignRole()`, `$user->hasRole()`, `@role` / `can()` directives

**Key layout**:
- `app/Models/` — Eloquent models
- `app/Http/Controllers/` — API controllers
- `routes/api.php` — All API routes (primary routes file)
- `database/migrations/` — Database schema

**Database**: MySQL by default; tests use SQLite in-memory (configured in `phpunit.xml`). Sessions, cache, and queues use the database driver.

**Testing**: PHPUnit — Feature (`tests/Feature/`) and Unit (`tests/Unit/`) suites run against isolated SQLite DB automatically.

---

## Next.js Frontend (`C:\Users\pc\Desktop\tato\emigrant-next`)

### Commands
```bash
npm run dev    # Start Next.js dev server
npm run build  # Production build
npm run lint   # ESLint
```

### Stack
- **Next.js 16** — App Router (not Pages Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4 + shadcn/ui (Radix UI primitives), `src/app/globals.css`
- **Forms**: React Hook Form + Zod validation
- **HTTP**: axios
- **Server state**: TanStack Query (React Query v5), configured with 60s staleTime
- **Auth state**: React Context (`src/contexts/AuthContext.tsx`)
- **UI lang**: Georgian (`lang="ka"`)

### Architecture
```
src/
├── app/
│   ├── (public)/      # login, register, search, listing/[id], forgot-password, reset-password
│   ├── (protected)/   # client/*, provider/*, admin/*
│   ├── layout.tsx     # Root layout — wraps in <Providers>
│   └── page.tsx       # Home page
├── components/
│   ├── ui/            # shadcn/ui components
│   └── *.tsx          # Shared components (Header, Footer, ListingCard, etc.)
├── contexts/
│   └── AuthContext.tsx  # Auth state: user, role (client|provider|admin), signIn/signOut/signUp
├── lib/
│   ├── data.ts        # Static/mock data — replace with API calls
│   └── utils.ts       # cn() tailwind merge utility
└── proxy.ts           # Middleware stub for route protection (currently disabled)
```

**Route protection**: `(protected)` route group wraps `/client`, `/provider`, `/admin`. Middleware in `src/proxy.ts` is stubbed — needs backend JWT/token check implemented.

**Auth**: `AuthContext` currently uses mock users (`client@test.ge`, `provider@test.ge`, `admin@test.ge`) stored in localStorage. All `signIn`/`signUp`/`signOut` methods have `// TODO` comments pointing to the Laravel API endpoints.

**Import alias**: `@/*` → `src/*`
