# Your Special Day

A personalized birthday celebration web app with location-based stamp collecting, gift coupons, a photo memory book, and a Spotify Wrapped-style year-in-review — all synced in real time across devices.

Live Demo : https://special-day-alpha.vercel.app/admin

## Features

- **Stamps** — Collect stamps by visiting real-world locations. GPS verification confirms you're at each checkpoint, and you can capture photo evidence with a built-in editor.
- **Coupons** — Redeem gift coupons unlocked by completing stamps. 3D animated coupon cards with QR code scanning support.
- **Memory Book** — All checkpoint photos gathered into a downloadable PDF album, synchronized across devices via Supabase Storage.
- **Wrapped** — A Spotify Wrapped-style slideshow recapping the day with stats, animations, and background music.
- **Fortune Teller** — An interactive fortune-telling experience.
- **Admin Panel** — Password-protected dashboard to create/edit stamps and coupons, reorder them via drag and drop, and configure app behavior.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Animation | Framer Motion + React Spring |
| Backend | Supabase (Postgres + Storage + Auth) |
| State | React Query + React Context |
| Routing | React Router DOM v6 |
| Deployment | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A Google Cloud project with the Places API enabled (optional, for map links)

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_GOOGLE_PLACES_API_KEY=your-google-places-api-key
```

### Database Setup

Run the SQL migration files in your Supabase SQL editor in order. They are located in the project root and set up the following tables:

- `stamps_progress` — tracks which stamps a user has collected
- `coupon_achievements` — tracks redeemed coupons
- `checkpoint_photos` — stores photo metadata and references
- `custom_stamps` / `custom_coupons` — admin-created items
- `admin_settings` — global app configuration

Row Level Security (RLS) is enabled on all tables, with anonymous authentication for user isolation.

### Install & Run

```bash
# Install dependencies
npm install

# Start development server (http://localhost:8080)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── App.tsx               # Root component with route definitions
├── main.tsx              # React entry point
├── components/           # Reusable UI components
├── pages/                # Page-level components
│   ├── Index.tsx         # Home page
│   ├── Stamps.tsx        # Stamp collection
│   ├── Coupons.tsx       # Gift coupons
│   ├── MemoryBook.tsx    # Photo album
│   ├── Wrapped.tsx       # Year-in-review slideshow
│   ├── ScanQR.tsx        # QR code scanner
│   └── admin/            # Admin panel pages
├── contexts/             # AdventureContext (global state)
├── utils/                # Services and helpers
│   ├── supabaseClient.ts # Supabase initialization
│   ├── supabaseSync.ts   # Cross-device sync logic
│   ├── photoStorage.ts   # Photo upload/retrieval
│   ├── memoryBookGenerator.ts # PDF generation
│   ├── adminStorage.ts   # IndexedDB for admin data
│   └── ...
├── hooks/                # Custom React hooks
└── types/                # TypeScript type definitions
```

## Deployment

The project is configured for [Vercel](https://vercel.com). `vercel.json` rewrites all routes to `index.html` for SPA support.

1. Push the repository to GitHub.
2. Import the project in Vercel.
3. Set the environment variables in the Vercel dashboard.
4. Deploy — Vercel handles builds automatically on every push.

## Admin Access

Navigate to `/admin/login` to access the admin panel. From there you can:

- Create and edit custom stamps (with GPS coordinates, radius, and icons)
- Create and edit custom coupons
- Reorder items via drag and drop
- Toggle default items on/off

## Design

- **Fonts:** Poppins (body), Playfair Display (headings), Dancing Script (decorative)
- **Palette:** Rose/pink primary, sage green secondary, cream/gold accent
- **Mobile-first** responsive layout
