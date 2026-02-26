# 🌿 EcoEquity AI

**Urban Heat Island Intelligence Dashboard** — Visualizing NDVI data to promote climate equity in European cities.

![EcoEquity AI Dashboard](https://placeholder.com/dashboard-preview)

## Overview

EcoEquity AI is a Next.js 14 application that maps urban heat islands using NDVI (Normalized Difference Vegetation Index) data. It empowers communities to identify heat-vulnerable districts and submit tree planting requests directly to city planners.

## Features

- 🗺️ **Interactive NDVI Map** — Leaflet-powered GeoJSON overlay with color-coded heat zones
- 🤖 **AI Insights** — Google Gemini-powered district analysis with equity focus
- 📊 **Dashboard** — City-wide thermal statistics and district rankings
- 🌳 **Tree Request System** — Community-driven tree planting requests stored in Supabase
- 💬 **Community Feed** — Real-time reports from residents with heat-level badges
- 🎨 **Glassmorphism UI** — Dark, professional design with Framer Motion animations

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| Mapping | React-Leaflet |
| Database | Supabase (PostgreSQL) |
| AI | Google Gemini Pro |
| Icons | Lucide React |

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

### 3. Set up Supabase

Run `supabase-schema.sql` in your Supabase SQL editor to create the `tree_requests` table.

### 4. Run the development server

```bash
npm run dev
```

Open http://localhost:3000

## NDVI Color Scale

| NDVI Range | Color | Meaning |
|-----------|-------|---------|
| < 0.2 | 🔴 Red | Critical heat island |
| 0.2 – 0.4 | 🟡 Amber | Moderate heat stress |
| > 0.4 | 🟢 Green | Healthy vegetation |

## Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/
│   ├── ai/           # AIInsightsPanel
│   ├── map/          # EcoMap (Leaflet, dynamic/no SSR)
│   ├── reports/      # ReportCard, CommunityFeed
│   └── ui/           # Sidebar, TreeRequestModal, DashboardView, MainDashboard
├── context/          # AppContext (useReducer global state)
├── lib/              # data.ts, supabase.ts, gemini.ts, ndvi.ts
└── types/            # TypeScript interfaces
```

## Sentinel API Usage

Here's an example of how to use the `/api/sentinel/catalog` route from the frontend to search the Sentinel Hub catalog:

```javascript
async function searchSentinelCatalog(searchParams) {
  try {
    const response = await fetch('/api/sentinel/catalog', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchParams),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Sentinel Catalog Search Results:', data);
    return data;
  } catch (error) {
    console.error('Error searching Sentinel Hub catalog:', error);
  }
}

// Example Usage:
const searchParams = {
  collections: ['sentinel-2-l2a'],
  datetime: '2023-01-01T00:00:00Z/2023-01-10T23:59:59Z',
  bbox: [13.3, 52.5, 13.5, 52.6],
  limit: 10,
};

searchSentinelCatalog(searchParams);
```

## License

MIT