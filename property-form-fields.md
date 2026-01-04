# Property Creation Form Fields

## Required Fields (*)

1. **Title** (text input)
   - Auto-filled with address if address is entered first
   - Placeholder: "Enter property title"

2. **Address** (autocomplete input with Google Maps integration)
   - Auto-geocodes to get latitude/longitude
   - Shows "Location found" indicator when coordinates are available

3. **Rooms** (button selector)
   - Options: 3, 3.5, 4, 4.5, 5, 5.5, 6
   - Visual button selection interface

4. **Source** (dropdown)
   - Options: Yad2, Friends & Family, Facebook, Madlan, Other

5. **Property Type** (dropdown)
   - Options: New, Existing apartment

6. **Status** (dropdown)
   - Options: Seen, Interested, Contacted Realtor, Visited, On Hold, Irrelevant, Purchased

## Optional Fields

7. **Property URL** (URL input)
   - Placeholder: "https://www.yad2.co.il/..."

8. **Square Meters** (number input)
   - Unit: m²
   - Placeholder: "Optional"

9. **Balcony Square Meters** (number input)
   - Unit: m²
   - Placeholder: "0"

10. **Asked Price** (number input with currency formatting)
    - Currency: ₪ (ILS)
    - Auto-formats with thousand separators
    - Calculates price per m² automatically (shown below field)

11. **Contact Name** (text input)

12. **Contact Phone** (tel input)

13. **Description** (textarea)
    - Multi-line text
    - Right-to-left (RTL) support
    - Rich text editing support (bold with Cmd+B)

14. **Has Apartment Broker** (checkbox)
    - Boolean flag indicating if property listing includes apartment broker service

## Auto-Calculated Fields (Not User Input)

- **Price per m²**: Calculated from asked_price ÷ (square_meters + 0.5 × balcony_square_meters)
- **Latitude/Longitude**: Auto-geocoded from address
- **Price per meter**: Calculated field (stored in database)

## Additional Features (Not Fields)

- **AI Data Extraction**: Optional section to extract property data from:
  - Screenshot/image paste
  - HTML content paste
  - Auto-populates form fields when successful

- **Attachments**: Can be added after property creation (not in initial form)

## Field Groups/Sections

1. **Basic Information**
   - Title
   - Address
   - Property URL

2. **AI Extraction** (collapsible)
   - Image/HTML extraction mode toggle
   - Extraction input area
   - Extract button

3. **Property Details**
   - Rooms
   - Square Meters
   - Balcony Square Meters
   - Asked Price
   - Price per m² (calculated, display only)

4. **Contact Information**
   - Contact Name
   - Contact Phone

5. **Classification**
   - Source
   - Property Type
   - Status

6. **Additional**
   - Description
   - Has Apartment Broker checkbox
