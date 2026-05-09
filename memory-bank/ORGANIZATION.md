# Code Organization Guide

This document describes the current organization structure and migration notes.

## Renovation hub (`/renovation`)

Renovation is **not** switched to `src/services/`; it uses **`src/lib/renovation.ts`** (and helpers such as **`renovation-tasks-export.ts`** for the tasks print page). Routes live under **`src/app/renovation/`** with desktop/mobile view splits per page.

## Current Structure

```
src/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout
│   ├── renovation/        # Renovation app (nested layout, tasks print at tasks/print)
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/                # Shared UI components (Button, Input, Modal, Select, Toast)
│   └── [feature components] # Feature-specific components
├── hooks/                  # Custom React hooks
│   ├── common/            # Common reusable hooks
│   │   ├── useClickOutside.ts
│   │   ├── useDebounce.ts
│   │   ├── useErrorHandler.ts
│   │   ├── useLocalStorage.ts
│   │   └── useMobile.ts
│   ├── queries/           # React Query hooks
│   │   ├── useProperties.ts
│   │   ├── useNotes.ts
│   │   └── useAttachments.ts
│   └── index.ts           # Barrel export
├── services/              # API/service layer
│   ├── propertyService.ts
│   ├── noteService.ts
│   ├── attachmentService.ts
│   └── index.ts           # Barrel export
├── lib/                   # Utilities, Supabase, domain logic
│   ├── auth.ts            # Authentication utilities
│   ├── properties.ts       # Property CRUD (property hunt — see migration note below)
│   ├── renovation.ts       # Renovation DB API (primary for /renovation)
│   ├── renovation-tasks-export.ts  # Tasks print/PDF grouping + provider filter helpers
│   ├── attachments.ts      # Attachments — see migration note below
│   ├── supabase.ts        # Database client & types
│   ├── validation.ts       # Zod schemas
│   └── …                  # phone.ts, renovation-*, format helpers, etc.
├── types/                 # TypeScript types
│   ├── property.ts
│   ├── renovation.ts
│   └── api.ts
├── utils/                 # Pure utility functions
│   ├── common.ts          # Common utilities (formatting, dates, etc.)
│   └── index.ts           # Barrel export
├── providers/             # React context providers
│   └── QueryProvider.tsx
└── test-utils/            # Testing utilities
    ├── setup.ts
    └── test-utils.tsx
```

## Migration Status

### ✅ Completed
- Error handling infrastructure
- Type safety improvements
- Services layer created
- React Query hooks created
- Shared UI components
- Common hooks organized
- Testing infrastructure

### ⚠️ In Progress / TODO
- **Legacy lib files**: `lib/properties.ts` and `lib/attachments.ts` are still being used
  - These should be migrated to use `services/` instead
  - Components need to be updated to use React Query hooks or services directly
  - This is a gradual migration that should be done incrementally

## Import Guidelines

### ✅ Preferred Imports

```typescript
// Services
import { getProperties, createProperty } from '@/services'

// React Query hooks
import { useProperties, useCreateProperty } from '@/hooks/queries'

// Common hooks
import { useMobile, useDebounce } from '@/hooks/common'

// UI components
import { Button, Input, Modal } from '@/components/ui'

// Utilities
import { formatCurrency, formatDate } from '@/utils'

// Types
import { Property, PropertyInsert } from '@/types/property'
```

### ⚠️ Legacy Imports (to be migrated)

```typescript
// These should be replaced with services
import { getProperties } from '@/lib/properties'  // ❌ Use services/propertyService
import { getPropertyAttachments } from '@/lib/attachments'  // ❌ Use services/attachmentService
```

## Component Organization

### Current Structure
Components are organized flatly in `components/` with a `ui/` subfolder for shared components.

### Future Consideration
If the component count grows significantly, consider organizing by feature:
```
components/
├── ui/              # Shared UI components
├── property/        # Property-related components
├── auth/            # Authentication components
└── map/             # Map-related components
```

## File Naming Conventions

- **Components**: PascalCase (e.g., `PropertyCard.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useProperties.ts`)
- **Services**: camelCase (e.g., `propertyService.ts`)
- **Utils**: camelCase (e.g., `common.ts`)
- **Types**: camelCase (e.g., `property.ts`)

## Barrel Exports

Barrel exports (`index.ts`) are used for cleaner imports:
- `src/hooks/index.ts` - Exports all hooks
- `src/hooks/common/index.ts` - Exports common hooks
- `src/hooks/queries/index.ts` - Exports query hooks
- `src/services/index.ts` - Exports all services
- `src/utils/index.ts` - Exports all utilities
- `src/components/ui/index.ts` - Exports UI components

## Next Steps

1. **Migrate legacy lib files**: Gradually replace `lib/properties.ts` and `lib/attachments.ts` usage with services
2. **Update components**: Migrate components to use React Query hooks where appropriate
3. **Add mutations folder**: Create `hooks/mutations/` for mutation hooks if needed
4. **Component organization**: Consider feature-based organization if component count grows
