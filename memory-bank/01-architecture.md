# Architecture & System Design

## System Architecture
**Pattern**: Client-Server with Real-time Database + File Storage
**Deployment**: Single-page application with API routes
**Maps**: Google Maps API integration with fallback geocoding

## Directory Structure
```
src/
├── app/
│   ├── page.tsx              # Main application entry point
│   ├── page-content.tsx     # Main application (auth + property management)
│   ├── layout.tsx           # Root layout with fonts and scripts
│   ├── globals.css          # Global styles and CSS variables
│   └── api/
│       ├── extract-property/ # Yad2 URL extraction endpoint
│       └── fetch-html/       # HTML fetching endpoint
├── components/
│   ├── LoginForm.tsx        # Authentication component
│   ├── PropertyForm.tsx     # Create/edit property modal
│   ├── PropertyCard.tsx     # Property display card
│   ├── PropertyDetailModal.tsx # Full property detail view
│   ├── KanbanBoard.tsx      # Kanban board with drag-and-drop
│   ├── KanbanCard.tsx       # Compact property card for Kanban
│   ├── MapView.tsx          # Google Maps integration
│   ├── NotesModal.tsx       # Notes management modal
│   ├── AttachmentUpload.tsx # File upload component
│   ├── StarRating.tsx       # Rating component
│   ├── AddressAutocomplete.tsx # Google Places autocomplete
│   └── PropertyMetaTags.tsx # SEO meta tags
├── lib/
│   ├── auth.ts              # Client-side auth helpers
│   ├── properties.ts        # Supabase CRUD operations
│   ├── attachments.ts       # Attachment management
│   ├── phone.ts             # Phone number formatting utilities
│   ├── supabase.ts          # Database client & types
│   └── utils.ts             # Utility functions (cn helper)
├── types/
│   └── property.ts          # TypeScript interfaces
└── constants/
    └── statuses.ts          # Status definitions and labels
```

## Data Flow
1. **Authentication**: Cookie-based session → Environment variable validation
2. **State Management**: React useState → Local component state only
3. **Database Operations**: Supabase client → Direct SQL operations
4. **File Storage**: Supabase Storage → Attachment file management
5. **UI Updates**: Optimistic updates → Real-time sync available
6. **Maps**: Google Maps API → Places autocomplete → Coordinate extraction

## Key Architectural Decisions

### Authentication Strategy
- **Choice**: Simple password + cookies
- **Rationale**: Single-user system, minimal complexity
- **Implementation**: Client-side validation with environment variables
- **Session**: 24-hour cookie expiry

### Database Design
- **Choice**: Supabase PostgreSQL
- **Schema**: Properties + Notes + Attachments tables with foreign keys
- **Features**: Computed columns, triggers, RLS enabled
- **Storage**: Supabase Storage buckets for attachments
- **Performance**: Indexes on status, created_at, property_id, coordinates

### State Management
- **Choice**: Local React state only
- **Rationale**: Simple CRUD operations, no complex global state
- **Pattern**: Lift state up to main page component
- **Real-time**: Available but not currently utilized

### UI Framework
- **Choice**: Tailwind CSS 4 with custom components
- **Pattern**: Mobile-first responsive design
- **Components**: Modular, reusable with clear prop interfaces
- **Typography**: Outfit font family
- **Theme**: Custom CSS variables with oklch color space

### Maps Integration
- **Primary**: Google Maps API with Places library
- **Fallback**: OpenStreetMap Nominatim for geocoding
- **Features**: Autocomplete, coordinate extraction, marker dragging
- **Layers**: Transit, Traffic, Bicycle, Schools

## Database Schema Details

### Properties Table
```sql
- id (UUID, primary key)
- title (TEXT, optional) - Custom property name
- address (TEXT, required)
- rooms (DECIMAL(3,1), allows 3.5)
- square_meters (INTEGER, nullable)
- balcony_square_meters (INTEGER, optional; counted at 50% in pricing)
- asked_price (INTEGER, nullable, ILS)
- price_per_meter (COMPUTED) - Auto-calculated with balcony rule
- contact_name (TEXT, nullable)
- contact_phone (TEXT, nullable)
- source (ENUM: Yad2, Friends & Family, Facebook, Madlan, Other)
- property_type (ENUM: New, Existing apartment)
- description (TEXT, nullable)
- url (TEXT, nullable) - Property listing URL
- apartment_broker (BOOLEAN, default false)
- rating (INTEGER, 0-5, optional)
- status (ENUM, default 'Seen')
- latitude (DECIMAL(10,8), nullable)
- longitude (DECIMAL(11,8), nullable)
- created_at (TIMESTAMP, auto-managed)
- updated_at (TIMESTAMP, auto-managed via trigger)
```

### Notes Table
```sql
- id (UUID, primary key)
- property_id (UUID, foreign key, cascade delete)
- content (TEXT, required)
- created_at (TIMESTAMP, auto-managed)
```

### Attachments Table
```sql
- id (UUID, primary key)
- property_id (UUID, foreign key, cascade delete)
- file_name (TEXT)
- file_path (TEXT) - Storage bucket path
- file_type (ENUM: image, video, pdf)
- file_size (INTEGER) - Bytes
- mime_type (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## Component Architecture

### PropertyCard
- **Purpose**: Display property in cards view
- **Features**: Status dropdown, inline editing, notes preview, attachment display
- **Interactions**: Edit, delete, view notes, status change, rating

### PropertyDetailModal
- **Purpose**: Full property detail view (Trello-style)
- **Features**: Complete property info, notes CRUD, attachments gallery, status buttons
- **Layout**: Responsive grid with organized sections

### KanbanBoard
- **Purpose**: Drag-and-drop status management
- **Library**: @dnd-kit/core and @dnd-kit/sortable
- **Features**: 7 status columns, visual feedback, mobile support

### MapView
- **Purpose**: Google Maps visualization
- **Features**: Custom markers, hover tooltips, info windows, layers, marker dragging
- **Integration**: Google Maps API + Places Service

### PropertyForm
- **Purpose**: Create/edit property modal
- **Features**: Address autocomplete, Yad2 URL extraction, file uploads, validation
- **Layout**: Glassmorphism design with circular room selector

## Security Model
- **Row Level Security**: Enabled but open policies (single user)
- **Environment Variables**: Client-accessible with NEXT_PUBLIC_ prefix
- **Session Management**: Cookie-based with 24-hour expiry
- **Data Validation**: TypeScript types + form validation
- **File Storage**: Supabase Storage with RLS policies

## API Routes
- **/api/extract-property**: Extracts property data from Yad2 URLs
- **/api/fetch-html**: Fetches HTML content for extraction

## External Integrations
- **Google Maps API**: Maps, Places autocomplete, geocoding
- **OpenStreetMap Nominatim**: Fallback geocoding service
- **Supabase**: Database, storage, real-time (available but not used)
