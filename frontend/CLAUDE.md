# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Build for production
npm run lint     # Run ESLint
```

No test runner is configured yet.

## Architecture

**Emigrant.GE** is a Georgian-language marketplace connecting Georgian emigrants worldwide with service providers (doctors, lawyers, translators, etc.). The UI is entirely in Georgian (ქართული).

### Stack
- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS v4, shadcn/ui (Radix UI primitives in `src/components/ui/`)
- TanStack Query for data fetching, React Hook Form + Zod for forms
- Framer Motion for animations

### Route Groups
- `src/app/(public)/` — unauthenticated pages: `/login`, `/register`, `/forgot-password`, `/reset-password`, `/search`, `/listing/[id]`
- `src/app/(protected)/` — role-gated dashboards:
  - `/client/` — saved listings, settings
  - `/provider/` — dashboard, create-listing, settings
  - `/admin/` — dashboard, messages, settings
- `src/app/page.tsx` — homepage (hero + search + category grid + VIP offers)

### Auth
`src/contexts/AuthContext.tsx` provides `useAuth()` with three roles: `"client"`, `"provider"`, `"admin"`. Currently uses **mock users** stored in `localStorage`. All auth methods have `// TODO: Replace with Laravel API call` comments marking where the real backend integration goes.

Mock credentials for development:
- `client@test.ge` / `password`
- `provider@test.ge` / `password`
- `admin@test.ge` / `password`

`src/proxy.ts` is the Next.js middleware stub — route protection is currently disabled pending the Laravel backend.

### Data Layer
`src/lib/data.ts` exports all static data: `PROFESSIONS`, `CATEGORIES`, `COUNTRIES`, `CITIES_BY_COUNTRY`, `LANGUAGES`, `NATIONALITIES`, and the `Listing` interface + `MOCK_LISTINGS` array. All search/filter logic operates on this mock data. When the Laravel API is ready, these will be replaced with API calls.

### Key Components
- `HeroSearchBar` — main search form with country/city/profession dropdowns, navigates to `/search`
- `SearchableSelect` — custom searchable dropdown used in HeroSearchBar
- `ListingCard` — card component for displaying a `Listing`
- `Providers` — wraps the app with `QueryClientProvider` + `AuthProvider` + `Toaster`

### Conventions
- `cn()` from `src/lib/utils.ts` (clsx + tailwind-merge) for className merging
- Path alias `@/` maps to `src/`
- Georgian strings appear directly in JSX — no i18n library is used
- shadcn/ui components live in `src/components/ui/` and should not be modified directly; extend by wrapping
