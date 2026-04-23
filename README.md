# Siswa-Rent

> **Cari rumah, bukan filter.**  
> A natural-language housing search platform built for Malaysian students.

Siswa-Rent helps students search for rental housing using the way they naturally speak: Bahasa Malaysia, English, or a mix of both. Instead of forcing users through rigid filters and long listing grids, the platform converts conversational queries into ranked housing recommendations with clear reasons.

Built for **GDG UTM Hackathon · Project 2030**.

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [Solution Overview](#solution-overview)
- [Why This Matters](#why-this-matters)
- [Rubric Alignment](#rubric-alignment)
- [How It Works](#how-it-works)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [API Overview](#api-overview)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Demo Flow](#demo-flow)
- [Current Status](#current-status)
- [Future Improvements](#future-improvements)
- [Team](#team)
- [License](#license)

---

## Problem Statement

Searching for student housing in Malaysia is often frustrating and inefficient.

Students usually search in natural language, for example:

```text
quiet place 10 min walk to UTM, halal food nearby, under RM700
bilik sewa Taman U, RM500–RM650
rumah untuk 3 orang bawah RM900 dekat masjid
````

However, most existing property platforms:

* rely on rigid dropdown filters
* assume English-first search behaviour
* do not understand mixed BM and English queries
* return large result grids without explaining relevance
* make students manually combine budget, distance, and lifestyle preferences

This creates unnecessary friction during a stressful and time-sensitive housing search process.

---

## Solution Overview

Siswa-Rent is a natural-language housing search platform designed around how Malaysian students actually search.

Users can describe:

* budget
* preferred area
* distance to campus
* housemate count
* nearby amenities
* lifestyle preferences such as quietness, convenience, or halal food access

The platform then:

1. interprets the user’s intent from natural language
2. identifies candidate rental locations near the requested anchor area
3. enriches results with pricing data
4. ranks the results based on fit and relevance
5. returns a shortlist with concise reasoning

Instead of “filter first, think later,” Siswa-Rent enables users to **search first, then evaluate meaningful results**.

---

## Why This Matters

This project addresses a real local use case with clear user value.

### Target Users

* university students
* first-time renters
* students relocating to a new campus area
* users who are more comfortable typing naturally than using complex filters

### Real-World Relevance

The product is designed for the Malaysian context:

* mixed BM + English search behaviour
* student-budget housing needs
* proximity to UTM and surrounding localities
* importance of affordability and convenience over luxury listing detail

---

## 1. Problem and Relevance

Siswa-Rent solves a practical, high-frequency problem: student housing discovery. It directly addresses the gap between how students naturally search and how current platforms force them to search.

## 2. Innovation

The innovation is not just showing property listings on a map. The key innovation is allowing **conversational, mixed-language housing search** and converting that into structured, ranked recommendations.

## 3. Technical Execution

The system combines:

* frontend user interaction
* AI-based intent extraction
* location search
* ranking logic
* persistence
* cloud deployment

This is a complete end-to-end implementation rather than a static prototype.

## 4. User Experience

The interface supports:

* landing page entry point
* natural-language search
* map and list views
* ranking with reasons
* details page exploration

This makes the prototype understandable and demo-ready.

## 5. Feasibility and Scalability

The architecture is cloud deployable, modular, and extensible:

* frontend deployed separately
* backend deployed on Cloud Run
* Supabase for persistence
* location and ranking logic can be expanded with more data sources

## 6. Impact

The platform can reduce time spent searching, improve search quality, and better match students with affordable housing options.

---

## How It Works

```text
User enters a mixed BM/EN housing query
        ↓
Genkit + Gemini extract structured intent
  { budget, anchor, radius, vibe, requirements, language }
        ↓
Google Places API retrieves nearby housing candidates
        ↓
Local pricing data enriches the results
        ↓
Ranking logic scores relevance by:
  price fit · distance · vibe match · context fit
        ↓
Top results are returned with one-line reasoning
```

### Example Query

```text
Rumah dekat UTM bawah RM700
```

### Example Interpreted Intent

```json
{
  "location": "UTM",
  "max_budget": 700
}
```

---

## System Architecture

### Frontend

The frontend provides the user interface for:

* landing page
* search flow
* map browsing
* result cards
* details view

### Backend

The backend is responsible for:

* receiving search requests
* parsing natural-language queries
* retrieving location candidates
* ranking results
* storing search and property data

### Data Layer

Supabase is used to:

* upsert property records
* store saved searches
* support future authenticated user flows

### Hosting

Both frontend and backend are deployed using **Google Cloud Run**.

---

## Tech Stack

| Layer               | Technology                                    |
| ------------------- | --------------------------------------------- |
| Frontend            | React, Framer Motion                          |
| Maps and Location   | Google Maps JavaScript API, Google Places API |
| AI / Intent Parsing | Genkit, Gemini                                |
| Backend             | Node.js, Express, TypeScript                  |
| Database            | Supabase                                      |
| Hosting             | Google Cloud Run                              |
| Data Enrichment     | Local JSON pricing dataset                    |

---

## Project Structure

```text
Siswa-Rent/
├── backend/
│   └── Siswa-Rent-vertex-agent/
│       ├── src/
│       │   ├── data/
│       │   ├── flows/
│       │   ├── lib/
│       │   └── tools/
│       ├── Dockerfile
│       ├── package.json
│       └── tsconfig.json
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── context/
│   ├── pages/
│   └── utils/
├── Dockerfile
├── server.js
├── package.json
└── vite.config.js
```

---

## API Overview

### Search Endpoint

```http
POST /api/search
```

### Example Request

```json
{
  "query": "Rumah dekat UTM bawah RM700"
}
```

### Example Response Shape

```json
{
  "saved_search": {
    "query_text": "Rumah dekat UTM bawah RM700",
    "location": "UTM",
    "max_budget": 700
  },
  "properties": [
    {
      "name": "Example Residence",
      "address": "Skudai, Johor",
      "price_min": 550,
      "price_max": 700,
      "latitude": 1.55,
      "longitude": 103.63
    }
  ]
}
```

---

## Local Development

### Prerequisites

* Node.js 18+
* npm
* Google Cloud project with Maps JavaScript API enabled
* Google Places API enabled
* Gemini API key
* Supabase project

### Install Frontend Dependencies

```bash
npm install
```

### Run Frontend

```bash
npm run dev
```

### Install Backend Dependencies

```bash
cd backend/Siswa-Rent-vertex-agent
npm install
```

### Run Backend

```bash
npm run dev
```

### Default Local URLs

Frontend:

```text
http://localhost:5173
```

Backend:

```text
http://localhost:3400
```

---

## Environment Variables

### Frontend `.env`

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_publishable_or_anon_key
VITE_GOOGLE_JAVASCRIPT_MAP_API=your_google_maps_api_key
VITE_API_BASE_URL=http://localhost:3400
```

### Frontend `.env.production`

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_publishable_or_anon_key
VITE_GOOGLE_JAVASCRIPT_MAP_API=your_google_maps_api_key
VITE_API_BASE_URL=your_deployed_backend_url
```

### Backend `.env`

Path:

```text
backend/Siswa-Rent-vertex-agent/.env
```

Example:

```bash
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
PORT=3400
```

---

## Deployment

### Backend Deployment

```bash
cd backend/Siswa-Rent-vertex-agent

gcloud run deploy Siswa-Rent-backend \
  --source . \
  --region asia-southeast1 \
  --allow-unauthenticated
```

### Frontend Deployment

```bash
cd ~/Siswa-Rent

gcloud run deploy siswa-rent-frontend \
  --source . \
  --region asia-southeast1 \
  --allow-unauthenticated
```

### Deployment Notes

* frontend uses Vite, so `VITE_*` variables must be available at build time
* backend must allow the deployed frontend origin via CORS
* frontend should only use Supabase publishable or anon keys
* secret and service-role keys must remain backend-only

---

## Demo Flow

For the clearest hackathon demo:

1. Open the live frontend URL
2. Show the landing page
3. Click **Start Searching**
4. Search using:

   * `Rumah dekat UTM bawah RM700`
5. Show:

   * ranked property cards
   * map markers
   * search relevance
6. Open one property details page
7. Return to the search page
8. Optionally show DevTools Network:

   * successful frontend-to-backend Cloud Run request
   * no localhost dependency

---

## Current Status

The project currently supports:

* live frontend deployment
* live backend deployment
* natural-language housing search
* map-based result browsing
* Supabase integration
* Google Maps integration
* Cloud Run demo readiness

---

## Future Improvements

* stronger listing coverage from additional sources
* richer ranking explanations
* better fallback handling for unavailable images or approximate coordinates
* improved saved search and user history flows
* migration to advanced Google Maps markers
* stronger CI/CD workflow for automatic deploy consistency

---

## Team

Built for **GDG UTM Hackathon · Project 2030** by **Scuba++**.

---

## License

This project is licensed under the **MIT License**.
See [LICENSE](./LICENSE) for details.
