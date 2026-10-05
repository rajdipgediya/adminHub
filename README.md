# AdminHub Frontend (Practical Assessment)

Hey! This is my submission for the AdminHub frontend assessment. I built out the dashboard, users, transactions, and bookings views based on the provided Figma designs. 

I set it up to be fully responsive. It matches the 1440px desktop frames, but when you scale down past 1024px it drops into the mobile layout (with the drawer and bottom tab bar).

### Tools used
- **Next.js 16** (App Router) + React 19 + TypeScript
- **Tailwind CSS v4** (I just used standard Tailwind colors like indigo/slate since they match the Figma palette perfectly)
- **TanStack Query v5** to handle all the async data, caching, and optimistic updates
- **Redux Toolkit** for local UI state (filters, sidebars, etc.)
- **Recharts** for the revenue chart
- **lucide-react** for most icons, though I exported some custom SVGs for the mobile nav in `public/figma/`

### How to run it

Make sure you're on Node 20.9+. 

```bash
npm install
npm run dev
```
It runs on `http://localhost:3000`. You don't need to configure any env vars. By default it talks to DummyJSON, but you can override it with `NEXT_PUBLIC_API_BASE_URL` if you want.

### API & Data Fetching Approach

I used [DummyJSON](https://dummyjson.com) to populate the tables since it's easy and fast:
- `/users` for the user directory
- `/carts` acts as our transactions 
- `/todos` acts as our bookings

Since DummyJSON obviously doesn't have custom "AdminHub" roles or transaction statuses, I wrote a mapper layer in `src/lib/api/mappers.ts`. It takes the raw DummyJSON data and transforms it into the strict Domain Models the UI actually expects. I seeded derived fields (like status) off the record IDs so they remain consistent across reloads. 

All API calls are wrapped in TanStack Query. I load the lists once and cache them. When you click into a detail view, it uses `initialData` from the cache so the page loads instantly while it refetches in the background. Mutations (like refunding or adding a user) optimistically update the cache so the UI reacts immediately, though DummyJSON doesn't actually save the writes so they'll reset on hard refresh.

### State Management Approach

I kept API state completely separate from UI state. 
- TanStack Query handles everything from the server.
- Redux Toolkit (`src/store/`) only handles client-side stuff:
  - `uiSlice`: tracking if the mobile drawer is open, active tabs, etc.
  - `filtersSlice`: stores the current search queries and table filters. Putting this in Redux means if you filter the table, click a user, and hit back, your filters are still there!
  - `selectionSlice`: tracks bulk-selected rows.

### Folder Structure

Quick overview of how I laid things out:
```text
src/
  app/                    # Next.js App Router setup
  components/
    layout/               # Shared shell (sidebar, topbar, mobile nav)
    ui/                   # Reusable base components (buttons, cards, tables)
    dashboard/            # Feature-specific components
    users/                
    ...
  hooks/                  # Custom react-query hooks and derived logic
  lib/                    # API client, mappers, formatters
  store/                  # Redux slices
  types/                  # TS interfaces
```

### A few extra notes on the design
- I noticed the Figma file was a bit contradictory in a few places (like the subtitle font size fluctuating between 12px and 13px), so I just normalized it to the majority usage.
- I skipped drawing the fake iOS status bar on the mobile screens since we're rendering in an actual browser.
- For the mobile cards, I used a bottom divider instead of the 4-sided outline to keep it consistent with the desktop layout.
- You can find a sample of the generated transaction print layout I made in `public/Sample_receipt_AdminHub.pdf`.

Let me know if you have any questions about the setup!
