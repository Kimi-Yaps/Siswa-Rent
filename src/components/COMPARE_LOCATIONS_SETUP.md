# Location Comparison Feature - Setup Guide

## Overview
The location comparison feature allows users to compare the distance from a property to nearby landmarks (Gas Stations, UTM, Malls) using Google Maps API.

## Features
✅ **Interactive Google Map Modal** - Shows both locations with markers
✅ **Distance Calculation** - Displays driving distance and duration
✅ **Brand-Aligned Styling** - Matches Recia font and warm color palette (#f0ede0)
✅ **Responsive Design** - Works on mobile and desktop
✅ **Smooth Animations** - Framer Motion animations for professional feel

## Required Database Schema

Ensure your `properties` table in Supabase has these columns:

```sql
-- Required columns for the comparison feature
ALTER TABLE properties ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
```

Example data insertion:
```sql
INSERT INTO properties (
  id,
  name,
  latitude,
  longitude,
  -- ... other fields
) VALUES (
  'prop-123',
  'Modern Apartment',
  3.1390,    -- latitude
  101.6869,  -- longitude
  -- ... other values
);
```

## Component Structure

### CompareLocations.jsx
- **Props:**
  - `isOpen` (boolean) - Controls modal visibility
  - `onClose` (function) - Callback to close modal
  - `propertyLocation` (object) - {lat, lng} of property
  - `propertyName` (string) - Name of the property
  - `comparisonType` (string) - Type: 'gas_station', 'utm', or 'mall'

### Comparison Points
The feature includes pre-configured landmarks:
- **Gas Station** - Default KL coordinates
- **UTM** - Johor campus coordinates
- **Mall** - Default KL coordinates

To customize these, edit `COMPARISON_POINTS` in [CompareLocations.jsx](./CompareLocations.jsx).

## Environment Setup

Ensure your `.env.local` has:
```
VITE_GOOGLE_JAVASCRIPT_MAP_API=your_api_key_here
```

The API key should have these permissions:
- Maps JavaScript API
- Directions API
- Places API

## Styling Details

### Brand Colors Used
- Primary Green: `#7D9E4E` (property marker)
- Accent Orange: `#FFB703` (comparison location marker)
- Background: `#f0ede0` (warm off-white)
- Text: `#1a1a1a` (dark)
- Font: Recia (serif)

### CSS Files
- [CompareLocations.css](./CompareLocations.css) - Modal and map styling
- [HouseDetails.css](../pages/HouseDetails.css) - Dropdown styling

## Usage in HouseDetails

```jsx
// 1. Import the component
import CompareLocations from '../components/CompareLocations';

// 2. Add state
const [isCompareOpen, setIsCompareOpen] = useState(false);
const [selectedComparison, setSelectedComparison] = useState(null);

// 3. Handle dropdown change
const handleComparisonChange = (e) => {
  const value = e.target.value;
  if (value && property && property.latitude && property.longitude) {
    setSelectedComparison(value);
    setIsCompareOpen(true);
  }
  e.target.value = '';
};

// 4. Render the component
<CompareLocations
  isOpen={isCompareOpen}
  onClose={() => {
    setIsCompareOpen(false);
    setSelectedComparison(null);
  }}
  propertyLocation={{ lat: parseFloat(property.latitude), lng: parseFloat(property.longitude) }}
  propertyName={property.name}
  comparisonType={selectedComparison}
/>
```

## Distance Calculation

The feature uses two methods:

1. **Directions API** (Primary) - Calculates driving distance and duration
2. **Haversine Formula** (Fallback) - Calculates straight-line distance if API fails

## Customization

### Add New Comparison Points
Edit `COMPARISON_POINTS` in CompareLocations.jsx:

```jsx
const COMPARISON_POINTS = {
  // ... existing points
  custom_point: {
    label: 'Custom Location',
    coordinates: { lat: 3.1390, lng: 101.6869 },
    icon: '📍',
    color: '#YOUR_COLOR',
  },
};

// Then add to dropdown in HouseDetails.jsx:
<option value="custom_point">Custom Location</option>
```

### Customize Colors
- Update `color` property in `COMPARISON_POINTS`
- Update CSS in `CompareLocations.css`
- Update marker styles in the Google Maps initialization

## Testing Checklist

- [ ] Properties have latitude/longitude in database
- [ ] Google Maps API key is valid
- [ ] Dropdown triggers modal when selecting comparison type
- [ ] Both locations appear on map with correct markers
- [ ] Distance and duration display correctly
- [ ] Modal closes properly
- [ ] Styling matches brand guidelines
- [ ] Works on mobile and desktop
- [ ] Animations are smooth

## Troubleshooting

### Map not showing
- Check if `VITE_GOOGLE_JAVASCRIPT_MAP_API` is set
- Verify API key has Maps JavaScript API enabled
- Check browser console for errors

### Distance not calculating
- Ensure property has valid latitude/longitude
- Check if Directions API is enabled for the API key
- Verify comparison point coordinates are valid

### Styling issues
- Check if Recia font is loaded
- Verify CSS file is imported
- Clear browser cache and rebuild

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Responsive design

## Performance Tips

- Lazy load Google Maps script on component mount
- Use `position: fixed` for modal to avoid layout shifts
- Map renders only when modal is open
- Markers and info windows cleared on modal close

## Future Enhancements

- [ ] Add route polyline visualization
- [ ] Support for public transportation calculations
- [ ] Multiple location comparisons
- [ ] Save favorite comparison points
- [ ] Historical distance tracking
- [ ] Integration with transit schedules
