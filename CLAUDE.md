# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server with Turbopack (localhost:3000)
npm run build        # Production build with Turbopack
npm run lint         # Run ESLint
npm run format       # Format with Prettier
npm run format:check # Check formatting without modifying
```

> Do not run `npm run dev` if a dev server is already running.

There are no automated tests in this project.

## Architecture

**CasaTrack** is a single-user home-buying tracker with a secondary renovation project hub at `/renovation`.

### Tech Stack

- **Next.js 15** App Router + TypeScript (strict) + Tailwind CSS 4 + Turbopack
- **Supabase** — PostgreSQL, Storage buckets, real-time available but unused
- **React Query (TanStack v5)** — server state for the property hunt module only
- **@dnd-kit** — drag-and-drop in Kanban board and renovation task views
- **Konva.js / react-konva** — canvas-based photo annotations in renovation gallery (`ImageAnnotator.tsx`)
- **YARL (Yet Another React Lightbox)** — image lightbox; custom `Lightbox.tsx` wraps it with zoom + iOS pinch fixes
- **Google Maps API** — map view, Places autocomplete, geocoding; OpenStreetMap Nominatim as fallback
- **FFmpeg.wasm + browser-image-compression** — client-side media processing before upload
- **Zod** — runtime validation; **date-fns** — date utilities
- **FullCalendar** (`@fullcalendar/react` + daygrid, timegrid, interaction) — renovation `/renovation/calendar` (dynamic import, `ssr: false`)
- **@hebcal/core** — Israeli holiday schedule (`il: true`) as background events on the renovation calendar (GPL-2.0)

### Two Independent Modules

**Property Hunt** (`/` route):
- Three views toggled by the user: Cards grid, Kanban (7 status columns), Map
- Root component: `src/app/page-content.tsx` — state lifted here, React Query for data
- Major components: `PropertyCard`, `PropertyDetailModal` (~66KB), `KanbanBoard`, `MapView` (~48KB), `PropertyForm` (~48KB)
- Property statuses: `Seen | Interested | Contacted Realtor | Visited | On Hold | Irrelevant | Purchased`
- Sources: `Yad2 | Friends & Family | Facebook | Madlan | Other`
- `price_per_meter` is a **DB-computed column**: `price ÷ (square_meters + 0.5 × balcony_square_meters)`
- `/api/extract-property` — extracts property fields from Yad2 URLs (OpenAI); `/api/fetch-html` — fetches HTML for extraction

**Renovation Hub** (`/renovation` routes):
- Sub-pages: dashboard, expenses, tasks, calendar (FullCalendar month + week: select to create timed, drag/resize to update), gallery, providers, files, needs, rooms, settings
- Budget route `/renovation/budget` is a client redirect → `/renovation/settings#budget`
- Only **one project can be active** at a time (enforced at app level, not DB constraint)

### Renovation Mobile / Desktop Split

The renovation module has a deliberate viewport-based component split at Tailwind `md` (768px):

1. `RenovationShell` (in `src/app/renovation/layout.tsx` → `RenovationProvider` → `RenovationShell`) detects viewport client-side via `window.matchMedia('(max-width: 768px)')` and provides it via `RenovationViewportProvider`.
2. Every route page calls `useRenovationMobile()` and mounts either `*Desktop` or `*Mobile` view:
   ```tsx
   // pattern used in every renovation page
   const isMobile = useRenovationMobile()
   return isMobile ? <TasksMobile /> : <TasksDesktop />
   ```
3. For components that can't use the context (modals, `DatePicker`), use `useRenovationMobileMedia()` instead — it uses `useSyncExternalStore` with `matchMedia` and returns `false` until after mount to avoid hydration mismatches.
4. Mobile kit lives in `src/components/renovation/mobile/`: `MobileBottomSheet`, `MobileSelectSheet`, `MobileFilterButton`, `MobileStickyFooter`.
5. Global modals (`ExpenseModal`/`ExpenseModalMobile`, `TaskModal`/`TaskModalMobile`, `QuickUploadModal`) are rendered inside `RenovationShell` — opened via `RenovationContext` flags (`isTaskModalOpen`, `isExpenseModalOpen`, `quickUploadFile`).
6. Shell modals use `z-[280]` on mobile so they sit above the floating tab bar (`z-40`). Mobile shell uses `h-dvh + overflow-hidden`, scroll only in `main`.

### Renovation Context (`RenovationContext.tsx`)

Manages: active project, team members, active profile, global modal open/close flags.

- **Profile selection**: which team member is "using" the app — stored in `localStorage` as `reno-profile:{projectId}` via `src/lib/renovation-profile.ts`. On first visit with team members, `RenovationProfileGate` shows full-screen picker.
- `refresh()` re-syncs project + team (call after mutations that affect these).
- Time-of-day greeting: English by default; Spanish (`Buenos días/tardes/noches`) for profiles named "Tamar" or "Rinat".

### Data Layer

```
src/lib/
├── supabase.ts           # Supabase client + manually maintained Database types
├── properties.ts         # Property CRUD
├── renovation.ts         # All renovation DB operations (comprehensive typed API)
├── attachments.ts        # Property attachment management
├── renovation-format.ts  # formatIls, formatTaskDue, taskDueCalendarDiffDays
├── renovation-profile.ts # localStorage helpers for active profile + greeting logic
├── auth.ts               # Cookie-based session helpers (isAuthenticated)
├── phone.ts              # Israeli phone formatting (WhatsApp 972 prefix / tel: links)
└── validation.ts         # Zod schemas
```

React Query hooks are in `src/hooks/queries/` and cover only the property hunt module. The renovation module calls `src/lib/renovation.ts` directly (no React Query).

The `Database` type in `supabase.ts` is **manually maintained** — update it when adding DB columns.

### Database & Migrations

**Property hunt schema**: `supabase-schema.sql` — run once in Supabase SQL editor.

**Renovation schema**: numbered SQL files in `supabase/renovation/`, run in order:
- `01_schema.sql` — core tables + RLS
- `02_storage.sql` — `renovation-gallery` bucket
- `03_rooms_and_task_room.sql`
- `04_files.sql`
- `05_expense_attachments.sql`
- `06_needs.sql`
- `07_providers.sql`
- `08_needs_completed.sql`
- `09_task_created_by.sql`
- `10_calendar_events.sql` — `renovation_calendar_events` (general + provider meetings)
- `11_calendar_address_created_by.sql` — `address`, `created_by_member_id` on calendar events

Storage buckets: `properties-attachments`, `renovation-gallery`, `renovation-files`.

### Authentication

Password: `NEXT_PUBLIC_AUTH_PASSWORD` env var. Session: cookie `casa-track-auth=true`, 24h expiry. `isAuthenticated()` from `src/lib/auth.ts`. `RenovationContext` redirects to `/?next=<path>` if not authenticated.

### Fonts

- **Property hunt** (`src/app/layout.tsx`): Varela Round + JetBrains Mono
- **Renovation** (`src/app/renovation/layout.tsx`): Assistant (with Hebrew subset), applied via `font-assistant` class

### Styling Conventions

- Tailwind CSS 4; CSS variables (oklch color space) in `src/app/globals.css`
- Ultra-flat design (no shadows), glassmorphism on modals
- `cn()` helper from `src/lib/utils.ts` for conditional class merging
- `useMobile()` (from `src/hooks/common/useMobile.ts`) gates desktop-only UI in the property hunt module

### File Naming

- Components: PascalCase (`PropertyCard.tsx`)
- Hooks: camelCase with `use` prefix (`useProperties.ts`)
- Utilities: camelCase (`renovation-format.ts`)
- View page-state hooks: `use*PageState.ts` pattern (e.g., `useTasksPageState.ts`)
- Shared logic between Desktop/Mobile: `*-shared.ts(x)` (e.g., `tasks-page-shared.ts`)
