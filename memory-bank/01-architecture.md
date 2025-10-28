# Architecture & System Design

## System Architecture
**Pattern**: Client-Server with Real-time Database
**Deployment**: Single-page application with API routes

## Directory Structure
```
src/
├── app/
│   └── page.tsx              # Main application (auth + property management)
├── components/
│   ├── LoginForm.tsx         # Authentication component
│   ├── PropertyForm.tsx      # Create/edit property modal
│   └── PropertyCard.tsx      # Property display card
├── lib/
│   ├── auth.ts              # Client-side auth helpers
│   ├── properties.ts        # Supabase CRUD operations
│   └── supabase.ts          # Database client & types
└── types/
    └── property.ts          # TypeScript interfaces
```

## Data Flow
1. **Authentication**: Cookie-based session → Environment variable validation
2. **State Management**: React useState → Local component state only
3. **Database Operations**: Supabase client → Direct SQL operations
4. **UI Updates**: Optimistic updates → Real-time sync available

## Key Architectural Decisions

### Authentication Strategy
- **Choice**: Simple password + cookies
- **Rationale**: Single-user system, minimal complexity
- **Implementation**: Client-side validation with environment variables

### Database Design
- **Choice**: Supabase PostgreSQL
- **Schema**: Properties + Notes tables with foreign keys
- **Features**: Computed columns, triggers, RLS enabled
- **Performance**: Indexes on status, created_at, property_id

### State Management
- **Choice**: Local React state only
- **Rationale**: Simple CRUD operations, no complex global state
- **Pattern**: Lift state up to main page component

### UI Framework
- **Choice**: Tailwind CSS with custom components
- **Pattern**: Mobile-first responsive design
- **Components**: Modular, reusable with clear prop interfaces

## Database Schema Details

### Properties Table
```sql
- id (UUID, primary key)
- address (TEXT, required)
- rooms (DECIMAL, allows 3.5)
- square_meters (INTEGER)
- balcony_square_meters (INTEGER, optional; counted at 50% in pricing)
- asked_price (INTEGER, ILS)
- price_per_meter (COMPUTED)
- contact info (name, phone)
- source (ENUM)
- property_type (ENUM)
- description (TEXT)
- status (ENUM, default 'Seen')
- timestamps (auto-managed)
```

### Notes Table
```sql
- id (UUID, primary key)
- property_id (UUID, foreign key)
- content (TEXT)
- created_at (TIMESTAMP)
```

## Security Model
- **Row Level Security**: Enabled but open policies (single user)
- **Environment Variables**: Client-accessible with NEXT_PUBLIC_ prefix
- **Session Management**: Cookie-based with 24-hour expiry
- **Data Validation**: TypeScript types + form validation