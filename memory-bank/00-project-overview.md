# CasaTrack - Project Overview

## Project Summary
**CasaTrack** is a single-user web application for managing the home-purchasing process. It allows tracking properties of interest, managing notes, and visualizing them through multiple views.

## Current Status: MVP Phase Complete ✅
- **Authentication**: Simple password-based login (130188)
- **Core CRUD**: Full property management implemented
- **Database**: Supabase PostgreSQL with proper schema
- **UI**: Responsive card-based layout with Tailwind CSS
- **Environment**: Development server running on localhost:3000

## Tech Stack
- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS + Turbopack
- **Backend**: Supabase (PostgreSQL + Real-time)
- **Authentication**: Cookie-based session management
- **Deployment**: Local development (production not yet configured)

## Key Features Implemented
1. Property CRUD operations (Create, Read, Update, Delete)
2. Auto-calculated price per square meter
3. Status tracking with visual indicators
4. Contact information management
5. Property source and type categorization
6. Responsive mobile-first design

## Environment Configuration
- **Password**: `NEXT_PUBLIC_AUTH_PASSWORD=130188`
- **Supabase URL**: Configured and working
- **Google Maps API**: Key added but not yet implemented
- **Development Server**: Running on port 3000

## Database Schema
- **Properties Table**: Complete with all required fields
- **Notes Table**: Ready for implementation
- **Computed Columns**: Price per meter automatically calculated
- **Triggers**: Auto-updating timestamps implemented

## User Authentication
- Simple password protection for single-user access
- Cookie-based session management (24-hour expiry)
- No multi-user support (by design)