# CasaTrack - Project Overview

## Project Summary
**CasaTrack** is a single-user web application for managing the home-purchasing process and (separately) a **Renovation** hub at `/renovation` for budget, expenses, tasks, and photo gallery. Property hunt: Cards, Kanban, Map. Renovation: run SQL in `supabase/renovation/` on Supabase first.

## Current Status: Feature-Complete MVP ✅
- **Authentication**: Modern login with glassmorphism design
- **Core CRUD**: Full property management implemented
- **Database**: Supabase PostgreSQL with proper schema including attachments and ratings
- **UI**: Modern design system: **property hunt** uses **Varela Round** + JetBrains Mono; **renovation** uses Assistant (Hebrew subset) via `font-assistant` in the renovation layout
- **UX**: Smooth animations, hover effects, and micro-interactions
- **Environment**: Development server running on localhost:3000

## Tech Stack
- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS 4 + Turbopack
- **Backend**: Supabase (PostgreSQL + Real-time + Storage)
- **Authentication**: Cookie-based session management
- **Maps**: Google Maps API with Places integration
- **Deployment**: Local development (production not yet configured)

## Key Features Implemented

### Renovation Management (New Module)
1. **Interactive Dashboard**: Modular overview of tasks, expenses, and photos.
2. **Expense & Budget Tracking**: Logs outlays against project budgets with line-item attachments.
3. **Tasks Kanban**: Robust drag-and-drop task tracking featuring assignments, due dates, labels, and specialized custom providers. **Print / Save as PDF** at [`/renovation/tasks/print`](src/app/renovation/tasks/print/page.tsx): open & in-progress tasks only, incomplete subtasks nested, optional **filter by provider** (incl. “No provider”), grouping **no room** then by room; model built in [`renovation-tasks-export.ts`](src/lib/renovation-tasks-export.ts). Linked from Tasks desktop/mobile toolbars; renovation shells hide the normal nav chrome on this route.
4. **Gallery Integration**: Advanced photo grouping into albums, inline tag creation, lightbox annotations, and bulk actions.
5. **Provider & File Management**: Seamlessly manage vendors and documentation with drag-and-drop multi-file upload progress parsing.
6. **Multi-profile Support**: Easily switch active users (`activeProfile`) within teams for isolated action tracking.
7. **Wishlist**: `/renovation/wishlist` tracks desired items with title, description, multiple links, unit price, amount, and calculated totals.

### Property Hunt Features
1. **Property CRUD operations** (Create, Read, Update, Delete)
2. **Auto-calculated price per square meter** (counts 50% of balcony area)
3. **Status tracking** with visual indicators (7 statuses)
4. **Contact information management** with WhatsApp integration
5. **Property source and type categorization**
6. **Property title field** for custom naming
7. **Property URL field** for listing links
8. **Apartment broker flag** (boolean field)

### Notes & Attachments
9. **Notes system** with timestamped entries and full CRUD
10. **Notes count display** on property cards
11. **Notes hover preview** on property cards
12. **Attachments system** - Image, video, and PDF file uploads
13. **Attachment display** in property cards and detail modal
14. **Attachment indicator** on map hover tooltips

### Views & Navigation
15. **Cards view** - Grid layout with property cards
16. **Kanban board** with drag-and-drop status management (7 columns)
17. **Map view** - Google Maps with property markers
18. **View toggle** between Cards, Kanban, and Map layouts
19. **Mobile bottom navigation** for view switching
20. **Desktop header navigation** with view tabs

### Map Features
21. **Google Maps integration** with custom property markers
22. **Address autocomplete** using Google Places API
23. **Automatic coordinate extraction** from addresses
24. **Fallback geocoding** using OpenStreetMap Nominatim
25. **Interactive map markers** with custom ₪ icons
26. **Marker dragging** for coordinate updates (desktop)
27. **Hover tooltips** with property details
28. **Info windows** on marker click
29. **Map layers** - Transit, Traffic, Bicycle lanes, Schools
30. **Property name labels** under markers
31. **"New" badges** for recently added properties (7 days)
32. **Irrelevant properties toggle** on map
33. **Attachment indicators** in hover tooltips

### Contact Features
34. **Click-to-call** phone numbers (tel: links)
35. **WhatsApp integration** - Direct messaging with Israeli number formatting (972 prefix)
36. **Phone number formatting** utilities for WhatsApp and tel links

### Property Details
37. **Property detail modal** - Trello-style full property view
38. **Star rating system** (0-5 stars) for properties
39. **Status change buttons** in detail modal
40. **Inline editing** for rooms and square meters on cards
41. **Property expansion** on mobile cards
42. **Description tooltips** on hover

### UI/UX Enhancements
43. **Responsive mobile-first design**
44. **Glassmorphism effects** throughout
45. **Smooth animations** and transitions
46. **Staggered card animations**
47. **Hover effects** and micro-interactions
48. **Custom scrollbars** and focus states
49. **Irrelevant properties** collapsible section in cards view
50. **Empty states** with helpful messaging

## Environment Configuration
- **Password**: Configured via environment variables (NEXT_PUBLIC_AUTH_PASSWORD)
- **Supabase URL**: Configured and working
- **Supabase Anon Key**: Configured
- **Google Maps API**: Key configured and fully integrated
- **Development Server**: Running on port 3000

## Database Schema

### Properties Table
- **Core Fields**: id, address, rooms, square_meters, asked_price, contact_name, contact_phone
- **Optional Fields**: balcony_square_meters, description, url, title, apartment_broker, rating
- **Computed Columns**: price_per_meter (auto-calculated with 50% balcony rule)
- **Coordinates**: latitude, longitude (for map display)
- **Status**: ENUM with 7 statuses
- **Source**: ENUM (Yad2, Friends & Family, Facebook, Madlan, Other)
- **Property Type**: ENUM (New, Existing apartment)
- **Timestamps**: created_at, updated_at (auto-managed)

### Notes Table
- **Fields**: id, property_id (FK), content, created_at
- **Relationship**: Cascade delete with properties

### Attachments Table
- **Fields**: id, property_id (FK), file_name, file_path, file_type, file_size, mime_type, created_at, updated_at
- **File Types**: image, video, pdf
- **Storage**: Supabase Storage buckets

### Indexes
- Properties: status, created_at, coordinates (latitude, longitude)
- Notes: property_id, created_at
- Attachments: property_id

## User Authentication
- Simple password protection for single-user access
- Cookie-based session management (24-hour expiry)
- No multi-user support (by design)
- Password visibility toggle in login form

## Recent Additions (Latest Session)
- **Renovation wishlist** (May 2026): Dedicated `/renovation/wishlist` tab for desired items, multiple links, unit price × amount totals, desktop/mobile UI, and SQL [`23_wishlist.sql`](supabase/renovation/23_wishlist.sql).
- **Renovation tasks print view** (May 2026): Dedicated print/PDF page for active tasks; provider filter; shared export logic in `src/lib/renovation-tasks-export.ts`.
- **Vendor budget** (April 2026): TanStack Table desktop + mobile list; incremental save UX; stable row order; CSV export — see progress log.
- **Renovation module** (ongoing): Providers, planned vs spent expenses, **FullCalendar v6** calendar with built-in drag/resize (migration history: react-big-calendar → FullCalendar v6 → Schedule-X v4 → back to FullCalendar v6 in May 2026), mobile/desktop shell split at `md`, profile gate, and related features documented in `02-progress-log.md`.
