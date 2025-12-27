# CasaTrack - Complete Application Design Prompt for Figma Make (AI)

## Application Overview
CasaTrack is a single-user web application for managing the home-purchasing process. It allows users to track properties of interest, manage notes, and visualize them through multiple views (Cards, Kanban Board, and Map).

**Tech Stack Context**: Next.js 15, TypeScript, Tailwind CSS, Supabase backend, Google Maps integration

---

## Page 1: Login Page

### Layout & Structure
- **Full-screen centered layout** with glassmorphism design
- **Centered content card** with backdrop blur effect
- **Background**: Gradient or blurred background (design direction to be specified)

### Content Elements

#### Header Section (Top)
- **Logo**: 24x24 icon in rounded container (house icon)
- **Application Title**: "CasaTrack" - large heading (5xl font size)
- **Subtitle**: "Your Home Purchasing Companion"
- **Attribution**: "Created by Omriland" (small text, gray)

#### Login Form Card
- **Card Style**: Glassmorphism effect (semi-transparent white with backdrop blur)
- **Rounded corners**: 3xl (large radius)
- **Padding**: Large (p-12)
- **Shadow**: Subtle shadow

#### Form Fields
1. **Password Input Field**
   - Label: "Password" (small, medium weight, gray-700)
   - Input field with:
     - Placeholder: "Enter your password"
     - Password visibility toggle button (eye icon) on the right
     - Glassmorphism background (subtle)
     - Rounded corners (2xl)
     - Focus state: Ring with primary color
   - Error state: Red error message below field (if invalid password)

2. **Submit Button**
   - Full width
   - Primary color background
   - Text: "Sign in" with arrow icon
   - Loading state: Spinner + "Signing in..." text
   - Disabled state: Reduced opacity when password is empty

#### Footer Text
- Small text: "Secure access to your property management dashboard"

### Interactions
- Password visibility toggle (eye icon)
- Form validation with error messages
- Loading states during authentication
- Smooth animations on form elements

---

## Page 2: Main Dashboard - Cards View

### Layout & Structure
- **Header**: Sticky top navigation bar with glassmorphism effect
- **Main Content**: Grid layout (responsive: 1 column mobile, 2 columns tablet, 3 columns desktop)
- **Mobile Bottom Navigation**: Fixed bottom bar (mobile only)

### Header Section (Sticky Top Bar)

#### Left Side
- **Logo**: 10x10 icon in rounded container with primary color background
- **App Name**: "CasaTrack" (Casa in gray-900, Track in primary color)
- **Property Count Badge**: Shows number of relevant properties (primary color background)

#### Right Side (Desktop)
- **View Toggle**: Segmented control with 3 options:
  - Cards (icon: list lines)
  - Kanban (icon: columns)
  - Map (icon: map pin)
  - Active state: White background with shadow
  - Inactive state: Transparent with hover effect
- **Add Property Button**: Primary color, rounded, with plus icon
- **Logout Button**: Icon button (logout icon)

#### Mobile Bottom Navigation
- **Cards Button**: Icon + "Cards" label
- **Kanban Button**: Icon + "Kanban" label
- **Map Button**: Icon + "Map" label
- **Add Property Button**: Large circular button (primary color, prominent)
- Active state: Primary color background with scale effect

### Empty State (No Properties)
- **Large Icon**: 32x32 icon in rounded container (primary color background)
- **Heading**: "Welcome to CasaTrack" (4xl font)
- **Description**: Multi-line text explaining the purpose
- **CTA Button**: "Add Your First Property" (large, primary color)
- **Feature Icons**: 3 small icons showing key features:
  - Track Details
  - Manage Status
  - Add Notes

### Property Cards Grid
- **Grid Layout**: Responsive columns (1/2/3 based on screen size)
- **Card Spacing**: Gap-8 between cards
- **Staggered Animation**: Cards fade in with delay

### Property Card Component

#### Card Structure
- **Background**: Glassmorphism effect (semi-transparent white)
- **Rounded Corners**: 2xl
- **Padding**: p-6
- **Hover Effect**: Background becomes more opaque, subtle shadow

#### Header Section
- **Title**: Property title (font-semibold, text-lg, gray-900, line-clamp-2)
- **Address**: Property address (text-xs, gray-500, line-clamp-1)
- **Status Badge**: Clickable badge with dropdown:
  - Color-coded by status (7 different statuses)
  - Small dot indicator
  - Dropdown arrow icon
  - Dropdown menu: List of all 7 statuses with checkmark for current
- **Added Date**: "Added X ago" (text-xs, gray-500, hover shows exact timestamp)

#### Property Stats Section (Grid 2 columns)
1. **Rooms Card**
   - Icon: Building/house icon
   - Label: "Rooms" (text-xs, gray-600)
   - Value: Number (text-xl, font-semibold)
   - Background: gray-50 with border
   - Double-click to edit (shows circular room selector: 3, 3.5, 4, 4.5, 5, 5.5, 6)

2. **Size Card**
   - Icon: Square/area icon
   - Label: "Size" (text-xs, gray-600)
   - Value: "X m²" or "Add size" (amber if not set)
   - Background: gray-50 with border
   - Shows balcony m² if available
   - Double-click to edit (number input)

#### Price Section
- **Background**: Gradient (primary color, 10% opacity)
- **Border**: Primary color, 20% opacity
- **Asking Price**: Large number (text-2xl, font-bold) with ₪ symbol
- **Price per m²**: Smaller text below (calculated automatically)

#### Additional Details Section
- **Property Type**: Icon + label + value
- **Source**: Icon + label + value
- **Broker**: Icon + label + "Yes/No" (with indicator dot if Yes)

#### Property URL Section (if exists)
- **Label**: "Property Link" (uppercase, small)
- **Link**: "View Listing" with external link icon

#### Attachments Section (if exists)
- **Label**: "Attachments" (uppercase, small)
- **Count**: Number of files
- **Grid**: 4-column grid of thumbnails
- **Overflow**: "+X" indicator if more than 4
- Click to open lightbox with navigation

#### Contact Information Section (if exists)
- **Background**: slate-50
- **Label**: "Contact" (uppercase, small)
- **Name**: Person icon + name
- **Phone**: Phone icon + clickable number (copy on click with "Copied!" tooltip)

#### Description Section (if exists)
- **Label**: "Description" (uppercase, small)
- **Text**: Truncated to 3 lines (line-clamp-3)
- **Hover**: Tooltip showing full description (RTL support)

#### Notes Section
- **Button**: "View Notes" with note icon
- **Count Badge**: Number of notes (primary color)
- **Hover**: Preview tooltip showing first 3 notes

#### Action Buttons (on card hover or click)
- **Edit**: Opens property form modal
- **Delete**: Shows confirmation modal
- **View Details**: Opens property detail modal

### Irrelevant Properties Section (Collapsible)
- **Toggle Button**: Red-themed header with trash icon
- **Count**: Number of irrelevant properties
- **Expand/Collapse**: Arrow icon rotates
- **Grid**: Same card layout as main grid
- **Animation**: Smooth expand/collapse with opacity transition

---

## Page 3: Main Dashboard - Kanban Board View

### Layout & Structure
- **Full Height**: Uses calc(100vh - 12rem)
- **Horizontal Scroll**: Columns scroll horizontally
- **7 Columns**: One for each status

### Column Structure

#### Column Header (Sticky Top)
- **Background**: slate-50/50 with white/80 backdrop blur
- **Border**: Bottom border (slate-200/60)
- **Collapse Toggle**: Chevron icon (rotates when collapsed)
- **Status Indicator**: Colored bar (1px height, full width)
- **Status Name**: Font-semibold, text-sm
- **Count Badge**: Number of properties in column

#### Collapsed Column State
- **Width**: 100px (narrow)
- **Vertical Text**: Status name written vertically
- **Count**: Shown vertically
- **Expand Button**: Click to expand

#### Expanded Column State
- **Width**: 320px
- **Content Area**: Scrollable vertical list
- **Empty State**: "No properties" or "Drop here" when dragging

#### Property Cards in Kanban (Compact)
- **Background**: White with border
- **Rounded**: lg
- **Padding**: p-4
- **Content**:
  - Title (line-clamp-2)
  - Address (line-clamp-1, gray-500)
  - Quick stats: Rooms, Size, Price
  - Status badge
- **Drag Handle**: Entire card is draggable
- **Hover**: Shadow effect

#### Drag Overlay
- **Style**: Rotated card with scale effect
- **Border**: Primary color, 2px
- **Shadow**: Large shadow
- **Content**: Same as card but larger

### Status Columns (7 total)
1. **Seen** - Gray theme
2. **Interested** - Emerald/Green theme (highlighted)
3. **Contacted Realtor** - Blue theme
4. **Visited** - Indigo theme
5. **On Hold** - Orange theme
6. **Irrelevant** - Red theme
7. **Purchased** - Green theme

---

## Page 4: Main Dashboard - Map View

### Layout & Structure
- **Full Height**: Uses calc(100vh - 12rem)
- **Map Container**: Full width and height
- **Google Maps Integration**: Embedded map

### Map Features
- **Property Markers**: Custom SVG pins with ₪ symbol
  - Color varies by status (primary color, yellow for Interested, gray for Irrelevant)
  - Hover effect: Larger pin
- **Info Windows**: Click marker to show property details
- **Hover Card**: Floating card follows mouse when hovering over marker
- **Labels**: Show address and price when zoomed in (mobile, zoom level 14+)

### Floating Controls (Top Right)
- **Layer Toggle Panel**:
  - Transit layer (on/off)
  - Traffic layer (on/off)
  - Bicycle lanes (on/off)
  - Schools (on/off)
  - Each with icon and checkmark when active
- **Show Irrelevant Toggle**: Toggle switch to show/hide irrelevant properties

### Property Count Display (Bottom Left)
- **Badge**: Shows "X of Y properties shown"
- **Hidden Count**: Shows count of hidden irrelevant properties

### Hover Card (Floating)
- **Position**: Follows mouse cursor
- **Content**: 
  - Property title
  - Address
  - Status badge
  - Quick stats (Rooms, Size)
  - Price section
  - Property type, source, broker info
- **Arrow**: Points to marker

### Empty State
- **Warning Banner**: "No coordinates available" if properties exist but no coordinates

---

## Page 5: Property Form Modal (Add/Edit)

### Layout & Structure
- **Overlay**: Dark backdrop with blur (black/20 opacity)
- **Modal**: Centered, max-width 3xl, max-height 90vh, scrollable
- **Background**: Glassmorphism (semi-transparent white with backdrop blur)
- **Rounded Corners**: 3xl

### Header Section
- **Icon**: 12x12 icon in gradient container (primary color)
- **Title**: "Add New Property" or "Edit Property" (text-3xl, font-semibold)

### Form Fields (in order)

#### 1. Title Field
- **Label**: "Title *" (required)
- **Input**: Text input, full width
- **Helper Text**: "This will be auto-filled with the address if you enter the address first"

#### 2. Address Field
- **Label**: "Address *" (required)
- **Input**: Google Places Autocomplete
- **Indicator**: "Location found" badge when coordinates detected

#### 3. Property URL Field
- **Label**: "Property URL"
- **Input**: URL input type
- **Placeholder**: "https://www.yad2.co.il/..."

#### 4. AI Data Extraction Section (Collapsible)
- **Header**: "AI Data Extraction" with collapse/expand button
- **Mode Toggle**: Two buttons (Image / HTML)
- **Image Mode**:
  - Drop zone for pasting screenshots
  - Shows preview when image pasted
  - Remove button
- **HTML Mode**:
  - Textarea for pasting HTML content
- **Extract Button**: Primary color, with progress bar during extraction
- **Result Modal**: Success/error message with extracted fields count

#### 5. Rooms Selector
- **Label**: "Rooms *" (required)
- **Layout**: Horizontal row of circular buttons
- **Options**: 3, 3.5, 4, 4.5, 5, 5.5, 6
- **Selected State**: Primary color background
- **Unselected State**: White with border

#### 6. Square Meters & Balcony (Grid 2 columns)
- **Square Meters**: Number input with "m²" prefix
- **Balcony m²**: Number input with "m²" prefix (optional)

#### 7. Price Field
- **Label**: "Asked Price (ILS)"
- **Input**: Text input with ₪ symbol prefix
- **Formatting**: Auto-formats with commas
- **Preview**: Shows "Price per m²" calculation below (if price and size entered)

#### 8. Contact Information (Grid 2 columns)
- **Contact Name**: Text input
- **Contact Phone**: Tel input

#### 9. Source & Property Type (Grid 2 columns)
- **Source**: Dropdown (Yad2, Friends & Family, Facebook, Madlan, Other)
- **Property Type**: Dropdown (New, Existing apartment)

#### 10. Status Field
- **Label**: "Status *" (required)
- **Dropdown**: All 7 status options with labels

#### 11. Description Field
- **Label**: "Description"
- **Textarea**: RTL support, multi-line
- **Helper Text**: "Enter for new line"

#### 12. Attachments Section (Edit mode only)
- **Label**: "Attachments"
- **Upload Area**: Drag & drop or click to upload
- **File List**: Grid of uploaded files with delete option
- **Info Message**: "You can add photos and videos after creating the property" (for new properties)

#### 13. Apartment Broker Checkbox
- **Layout**: Checkbox with label and description
- **Icon**: Person icon
- **Description**: "Check this if the property listing includes an apartment broker service"

### Footer Actions
- **Cancel Button**: Secondary style, shows "ESC" keyboard shortcut
- **Submit Button**: Primary gradient, shows "⌘↵" keyboard shortcut
- **Loading State**: Spinner + "Saving..." text

### Keyboard Shortcuts
- **Cmd/Ctrl + Enter**: Submit form
- **ESC**: Cancel/close modal

---

## Page 6: Property Detail Modal

### Layout & Structure
- **Overlay**: Dark backdrop with blur
- **Modal**: Max-width 5xl, max-height 85vh, scrollable
- **Background**: White with border and shadow

### Header Section (Sticky Top)
- **Close Button**: Top right corner (X icon)
- **Title**: Property title (text-2xl, font-bold, line-clamp-2)
- **Address**: Property address (text-sm, gray-500, line-clamp-1)
- **Status Badge**: Clickable with dropdown (same as card)
- **Action Buttons**: Edit (pencil icon) and Delete (trash icon)

### Content Sections (Scrollable)

#### 1. Description Section (Full Width)
- **Background**: slate-50
- **Label**: "Description" (uppercase, small)
- **Content**: RTL text area
- **Edit Mode**: Textarea with save/cancel buttons
- **View Mode**: Double-click to edit (desktop) or Edit button (mobile)

#### 2. Property Details & Pricing (Grid 2 columns)

**Left Column - Property Details**:
- **Background**: slate-50
- **Label**: "Property Details" (uppercase, small)
- **Grid 2x2**:
  - Rooms: Icon + value
  - Size: Icon + value (with balcony if exists)
  - Type: Icon + value
  - Source: Icon + value
- **Contact Section** (if exists):
  - Name with person icon
  - Phone with phone icon

**Right Column - Pricing**:
- **Background**: Gradient (blue-50 to cyan-50)
- **Label**: "Pricing" (uppercase, small)
- **Asking Price**: Large number with ₪
- **Price per m²**: Below asking price

#### 3. Attachments Section
- **Background**: slate-50
- **Header**: "Attachments" with count and "Add Files" button
- **Grid**: 2/3/4 columns (responsive)
- **Items**: Thumbnails with delete button on hover
- **Empty State**: Icon + "No attachments yet" message
- **Click**: Opens lightbox with navigation and zoom

#### 4. Notes Section
- **Header**: "Notes" with count
- **Notes List**: 
  - Each note card with:
    - Timestamp (relative: "X min ago", "Yesterday", etc.)
    - Content (editable on double-click)
    - Edit/Delete buttons
- **Add Note Form** (at bottom):
  - Textarea
  - Submit button
  - Keyboard shortcut hint: "Cmd/Ctrl+Enter to submit"

### Lightbox (Attachment Viewer)
- **Full Screen**: Black backdrop (90% opacity)
- **Image/Video**: Centered, max 85vh height
- **Navigation**: Previous/Next arrows (hidden on mobile)
- **Zoom**: Click image to zoom 2.5x (desktop)
- **Info Bar**: Filename, counter (X/Y), zoom hint
- **Close**: X button top right
- **Keyboard**: Arrow keys to navigate, ESC to close
- **Touch**: Swipe left/right on mobile

### Delete Confirmation Modal
- **Overlay**: Dark backdrop
- **Card**: White with border
- **Icon**: Warning icon (red)
- **Title**: "Delete Property"
- **Message**: Confirmation text with property name
- **Actions**: Cancel (secondary) and Delete (red) buttons

---

## Design System Elements

### Colors
- **Primary**: Teal/mint green (oklch color space)
- **Status Colors**:
  - Seen: Gray
  - Interested: Emerald/Green (highlighted)
  - Contacted Realtor: Blue
  - Visited: Indigo
  - On Hold: Orange
  - Irrelevant: Red
  - Purchased: Green/Emerald

### Typography
- **Font Family**: Outfit (primary), JetBrains Mono (monospace)
- **Headings**: Various sizes (text-2xl to text-5xl)
- **Body**: text-sm to text-base
- **Labels**: text-xs, uppercase, tracking-wide

### Spacing & Layout
- **Container**: Max-width 7xl (main content)
- **Padding**: px-6 sm:px-8 lg:px-10 (responsive)
- **Gaps**: gap-4 to gap-8
- **Border Radius**: rounded-lg to rounded-3xl

### Effects
- **Glassmorphism**: backdrop-blur-sm with semi-transparent backgrounds
- **Shadows**: Subtle to large (shadow-sm to shadow-2xl)
- **Animations**: Fade-in, spring-in, smooth transitions
- **Hover States**: Scale, opacity, shadow changes

### Interactive Elements
- **Buttons**: Rounded, with hover effects
- **Inputs**: Rounded, with focus rings
- **Cards**: Hover effects, clickable
- **Modals**: Backdrop blur, smooth animations

---

## Responsive Breakpoints
- **Mobile**: < 768px (single column, bottom navigation)
- **Tablet**: 768px - 1024px (2 columns)
- **Desktop**: > 1024px (3 columns, full navigation)

---

## Design Direction (To Be Filled In)

**[INSERT YOUR DESIGN DIRECTION HERE]**

Examples:
- "Modern minimalist design with soft pastels"
- "Bold, vibrant colors with strong contrast"
- "Dark mode with neon accents"
- "Warm, inviting design with organic shapes"
- etc.

---

## Additional Notes

### Accessibility
- Keyboard navigation support
- Focus states on all interactive elements
- ARIA labels where needed
- Color contrast compliance

### Animations
- Smooth transitions (200-300ms)
- Staggered card animations
- Loading states with spinners
- Hover effects with scale/opacity

### Mobile Considerations
- Touch-friendly targets (min 44x44px)
- Swipe gestures for lightbox
- Bottom navigation for easy thumb access
- Collapsible sections to save space

### RTL Support
- Description fields support RTL text
- Proper text direction handling
- Icon positioning considerations

---

**End of Prompt**

