# Save the PRD text as a Markdown (.md) file

prd_text = """# PRD: Home Purchasing Management Website

## 1. Overview
This project aims to build a lightweight but powerful web application for personal use to manage the home-purchasing process.  
The tool will allow the user to store, track, and organize properties of interest, maintain notes, and visualize them in multiple views (board, map).  

The system will be **for single-user use only** with simple password-based access, no multi-user support.  

Backend: **Supabase**  
Frontend: **React / Next.js**  

---

## 2. Goals
- Centralize all information about properties of interest in one place.  
- Support structured property details entry, notes, and status tracking.  
- Provide visual views (Kanban-style board and map view).  
- Ensure the system is lightweight, secure enough for personal use, and easy to maintain.  

---

## 3. Users
- **Primary User**: The homeowner (single user).  
- **Authentication**: Simple password prompt when entering the site (hardcoded or Supabase auth with minimal config).  

---

## 4. Functional Requirements

### 4.1 Property Management
- Add new property with fields:
  - **Address** (Google Maps autocomplete)  
  - **Rooms** (decimal allowed, e.g., 3.5)  
  - **Square meters** (numeric)  
  - **Asked price** (ILS)  
  - **Price per meter** (auto-calculated = price ÷ square meters)  
  - **Contact info** (name + phone number)  
  - **Source** (dropdown: Yad2, Friends & Family, Facebook, Madlan, Other)  
  - **Property type** (New, Existing apartment)  
  - **Description** (long text)  
  - **Comments/Notes** (log-style, timestamped entries)  

- Edit/update property details.  
- Delete property.  

### 4.2 Status Tracking
- Each property has a status (enum):  
  - Seen  
  - Interested  
  - Contacted Realtor  
  - Visited  
  - On Hold  
  - Irrelevant  
  - Purchased  

- Properties can be moved between statuses via drag-and-drop in **Kanban board view**.  

### 4.3 Notes System
- Multiple notes per property.  
- Each note is stored with **content + timestamp**.  
- Notes displayed in chronological order.  

### 4.4 Views
- **Kanban Board View**:  
  - Columns represent statuses.  
  - Properties are draggable cards.  
  - Each card shows: address, price, rooms, sqm, status, key details.  

- **Map View**:  
  - Uses Google Maps API.  
  - Properties shown as pins.  
  - Clicking pin opens property details preview.  

- **List View (future enhancement)**:  
  - Table view with sorting/filtering.  

### 4.5 Filtering & Search
- Search bar for address, description, or notes.  
- Filters: status, property type, source, price range, room count.  
- Sorting: price, size, price/m².  

---

## 5. Non-Functional Requirements
- **Performance**: Fast load, responsive UI.  
- **Security**:  
  - Basic login with password.  
  - Data stored securely in Supabase.  
- **Scalability**: Designed for single-user, but data model should support expansion.  
- **Mobile-first**: Must be responsive and work on mobile devices.  
- **Maintainability**: Use Supabase for auth + DB, Next.js for frontend.  

---

## 6. MVP Scope
For the MVP, include:
- Authentication (basic password gate).  
- Add/edit/delete properties with required fields.  
- Kanban board view for statuses.  
- Notes per property with timestamps.  
- Map view with pins (Google Maps integration).  
- Auto-calculation of price per m².  
- Filters: by status, property type.  
- Search by address.  

---

## 7. Future Scope
- List view with advanced filtering and sorting.  
- Import data automatically from real-estate sites (Yad2, Madlan APIs).  
- File uploads (contracts, images).  
- Sharing/collaboration with multiple users.  
- Analytics dashboard (e.g., average price per m² by neighborhood).  

---

## 8. Success Metrics
- Can track all properties of interest without relying on spreadsheets/notes.  
- Easy to compare properties visually (board + map).  
- Smooth and intuitive UX with minimal clicks.  
"""


