# Code Organization Guide

This document describes the current organization structure and migration notes.

## Current Structure

```
src/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout
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
├── lib/                   # Legacy utilities and helpers
│   ├── auth.ts            # Authentication utilities
│   ├── phone.ts           # Phone formatting utilities
│   ├── fetchRenderedHtml.ts # HTML fetching utility
│   ├── supabase.ts        # Supabase client
│   ├── errors.ts           # Error handling utilities
│   ├── validation.ts       # Zod validation schemas
│   ├── properties.ts       # ⚠️ LEGACY - Use services/propertyService.ts
│   └── attachments.ts      # ⚠️ LEGACY - Use services/attachmentService.ts
├── types/                 # TypeScript types
│   ├── property.ts
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
