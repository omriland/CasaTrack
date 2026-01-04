# CasaTrack

A modern, single-user web application for managing the home-purchasing process. Track properties of interest, manage notes, attachments, and visualize them through multiple views (Cards, Kanban, and Map).

## Features

### Core Features
- **Property Management**: Full CRUD operations for properties
- **Status Tracking**: 7 statuses with visual indicators
- **Notes System**: Timestamped notes with full CRUD
- **Attachments**: Image, video, and PDF file uploads
- **Multiple Views**: Cards, Kanban board, and Map view
- **Google Maps Integration**: Interactive map with custom markers
- **Address Autocomplete**: Google Places API integration
- **WhatsApp Integration**: Direct messaging with Israeli number formatting
- **Star Ratings**: 0-5 star rating system for properties

### Technical Features
- **Modern Stack**: Next.js 15, React 19, TypeScript, Tailwind CSS 4
- **Database**: Supabase PostgreSQL with real-time capabilities
- **State Management**: React Query (TanStack Query) for server state
- **Error Handling**: Comprehensive error boundaries and toast notifications
- **Type Safety**: Strict TypeScript with Zod validation
- **Testing**: Vitest for unit tests, Playwright for E2E tests
- **Code Quality**: ESLint, Prettier, Husky pre-commit hooks

## Tech Stack

- **Frontend**: Next.js 15 + React 19 + TypeScript + Tailwind CSS 4
- **Backend**: Supabase (PostgreSQL + Storage + Real-time)
- **State Management**: TanStack Query (React Query)
- **Maps**: Google Maps API with Places integration
- **Code Quality**: ESLint + Prettier

## Getting Started

### Prerequisites

- Node.js >=20 <21
- npm or yarn
- Supabase account
- Google Maps API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd CasaTrack
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
NEXT_PUBLIC_AUTH_PASSWORD=your_password
OPENAI_API_KEY=your_openai_api_key  # Optional: for property extraction
```

4. Set up the database:
Run the SQL schema from `supabase-schema.sql` in your Supabase SQL editor.

5. Set up storage:
Follow instructions in `setup-storage-bucket.md` to configure Supabase Storage.

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/                # Shared UI components
│   └── ...                # Feature components
├── hooks/                  # Custom React hooks
│   ├── common/            # Common reusable hooks
│   └── queries/           # React Query hooks
├── services/              # API/service layer
├── lib/                   # Utilities and helpers
├── types/                 # TypeScript types
├── utils/                 # Pure utility functions
└── providers/             # React context providers
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## Architecture

### Code Organization

- **Services Layer**: Abstract API calls (`src/services/`)
- **Hooks**: Reusable React hooks (`src/hooks/`)
- **Components**: UI components organized by feature (`src/components/`)
- **Types**: TypeScript type definitions (`src/types/`)
- **Utils**: Pure utility functions (`src/utils/`)

### State Management

- **Server State**: React Query for data fetching and caching
- **Client State**: React useState for local component state
- **UI State**: Context API for shared UI state (modals, theme)

### Error Handling

- **Error Boundaries**: Catch React component errors
- **Error Types**: Custom error classes for different error types
- **Toast Notifications**: User-friendly error messages
- **Error Logging**: Centralized error logging (ready for production monitoring)

### Type Safety

- **Strict TypeScript**: Enabled with strict null checks
- **Zod Validation**: Runtime validation for API inputs
- **Type Generation**: Type-safe API responses

## Code Quality

### Code Formatting
Prettier is configured to maintain consistent code style.

```bash
npm run format
```

## Database Schema

### Properties Table
- Core fields: id, title, address, rooms, square_meters, asked_price
- Optional fields: balcony_square_meters, description, url, contact info
- Computed: price_per_meter (auto-calculated with 50% balcony rule)
- Status: ENUM with 7 statuses
- Coordinates: latitude, longitude for map display

### Notes Table
- Fields: id, property_id (FK), content, created_at
- Cascade delete with properties

### Attachments Table
- Fields: id, property_id (FK), file_name, file_path, file_type, file_size
- Storage: Supabase Storage buckets

## Authentication

Simple password-based authentication for single-user access. Password is configured via `NEXT_PUBLIC_AUTH_PASSWORD` environment variable.

## Deployment

See `DEPLOYMENT.md` for deployment instructions.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and for personal use only.

## Support

For issues and questions, please open an issue in the repository.
