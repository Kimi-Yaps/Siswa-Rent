# Siswa-Rent · QuerySaja

> **cari rumah, bukan filter** — housing search that speaks your language.

A natural language property search built for Malaysian students. Type the way you talk — BM, English, or both — and get a ranked shortlist with reasons, not a 40-page grid.

Built in 48 hours for **GDG UTM Hackathon · Project 2030**.

---

## The Problem

Malaysian students search like this on Facebook & So:

```
"quiet place 10 min walk to UTM, halal food nearby, under RM700"
"bilik sewa Taman U, RM500–RM650"
"rumah untuk 3 orang bawah RM900 dekat masjid"
```

Every existing portal (iProperty, Mudah, PG) forces them to re-type that as English-first filter dropdowns. QuerySaja doesn't.

---

## How It Works

```
User types mixed BM+EN query
        ↓
Genkit + Gemini extracts structured intent
  { max_price, radius_km, anchor, vibe, lang }
        ↓
Google Places API finds nearby listings
  within the parsed radius around UTM
        ↓
prices.json enriches with student-sourced rent data
        ↓
fit_score ranker scores on:
  distance · price fit · vibe match · landlord quality
        ↓
Top 5 results returned with one-line reasoning each
```

**Single endpoint:** `POST /api/search`  
**Infrastructure:** Node · Express · Google Cloud Run (autoscaled, stateless)  
**Persistence:** Supabase — `properties` upsert, `saved_searches` insert

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Framer Motion |
| Maps & Location | Google Maps JavaScript API · Google Places API (Nearby Search) |
| AI / Intent Parsing | Genkit + Gemini |
| Backend | Node.js · Express | Typescript |
| Hosting | Google Cloud Run |
| Database | Supabase (PostgreSQL) |
| Env Config | `VITE_GOOGLE_JAVASCRIPT_MAP_API` |

---

## Frontend Components

### `CompareLocations`

A portal-based modal that renders a live Google Map comparing distance between a property and a nearby point of interest (gas station, mall, UTM campus).

**Props:**

| Prop | Type | Description |
|---|---|---|
| `isOpen` | `boolean` | Controls modal visibility |
| `onClose` | `() => void` | Close handler |
| `propertyLocation` | `{ lat, lng }` | Property coordinates |
| `propertyName` | `string` | Display name for the property |
| `comparisonType` | `'gas_station' \| 'mall' \| 'utm'` | POI category to compare against |

**Behaviour:**
- Uses `Places.nearbySearch` within a 5 km radius to find the nearest real POI
- Falls back to hardcoded coordinates if Places API is unavailable
- Calculates straight-line distance with the Haversine formula
- Estimates driving time at 60 km/h average
- Draws a polyline between the two markers
- Rendered via `createPortal` to `document.body` — z-index safe above all layout

**Centering fix:** Framer Motion controls the `transform` property during scale animations, which overrides CSS `transform: translate(-50%, -50%)`. Centering is applied via inline `style` and Framer Motion's `x`/`y` props instead:

```jsx
<motion.div
  className="compare-modal"
  style={{ top: '50%', left: '50%', x: '-50%', y: '-50%' }}
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.95 }}
>
```

---

## API

### `POST /api/search`

**Request:**
```json
{
  "query": "cari rumah dekat UTM bawah RM700 tenang"
}
```

**Gemini extracts:**
```json
{
  "max_price": 700,
  "radius_km": 2,
  "anchor": "UTM Skudai",
  "vibe": ["quiet"],
  "lang": "ms+en"
}
```

**Response:**
```json
{
  "results": [
    {
      "place_id": "ChIJ_7aR...Skudai",
      "name": "Unit Residen UTM",
      "price_myr": 600,
      "distance_km": 0.3,
      "fit_score": 0.98,
      "summary": "On-campus adjacent, within budget, quiet side street.",
      "reasoning": "Matched radius 0.3<2km, price 600<700, vibe:quiet via Places review tags."
    }
  ]
}
```

Returns **5 results max**, ranked by `fit_score`, with one-line reasoning in the query language.

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Google Cloud project with **Maps JavaScript API** and **Places API** enabled
- A Gemini API key (via Genkit)
- Supabase project

### Environment Variables

```bash
# Frontend (.env)
VITE_GOOGLE_JAVASCRIPT_MAP_API=your_maps_api_key

# Backend (.env)
GEMINI_API_KEY=your_gemini_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Install & Run

```bash
# Clone
git clone https://github.com/team-siswa/querysaja
cd querysaja

# Frontend
cd client
npm install
npm run dev

# Backend
cd ../server
npm install
npm run start
```

### Deploy to Cloud Run

```bash
gcloud run deploy querysaja \
  --source . \
  --region asia-southeast1 \
  --allow-unauthenticated
```

---

## Fit Score

Each listing is scored across four dimensions:

| Dimension | Signal |
|---|---|
| **Distance** | Parsed `radius_km` vs. actual distance from anchor |
| **Price fit** | `max_price` from query vs. listing `price_myr` |
| **Vibe match** | Query vibe tags (`quiet`, `halal`, `gated`) vs. Places review tags |
| **Landlord quality** | Rating and review count from Places |

Scores are normalised to `[0, 1]`. Top 5 returned.

---
