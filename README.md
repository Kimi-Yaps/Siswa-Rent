# Siswa-Rent · QuerySaja

> **cari rumah, bukan filter** — housing search that speaks your language.

A natural language property search built for Malaysian students. Type the way you talk — BM, English, or both — and get a ranked shortlist with reasons, not a 40-page grid.

Built in 48 hours for **GDG UTM Hackathon · Project 2030**.

---

## The Problem

Malaysian students search like this on Facebook & Social Media:

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
| Backend | Node.js · Express · TypeScript |
| Hosting | Google Cloud Run |
| Database | Supabase (PostgreSQL) |
| Env Config | `VITE_GOOGLE_JAVASCRIPT_MAP_API` |

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

## License

MIT — see [LICENSE](./LICENSE)

---

*GDG UTM Hackathon · Project 2030 · team@siswa-rent.my*
