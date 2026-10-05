# AdminHub — Admin Dashboard

A responsive admin dashboard built from the AdminHub Figma design: Dashboard, Users, Transactions and Bookings, plus a detail view for each record. Desktop matches the 1440px frames; below 1024px the app switches to the mobile frames (branded top bar, slide-in drawer, bottom tab bar, card lists).

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4**: the Figma palette is Tailwind's default indigo / slate / emerald / amber / red / blue, so components use the stock utilities
- **TanStack Query v5** for API data (fetching, caching, mutations)
- **Redux Toolkit** for client-side app state
- **Recharts** for the desktop revenue chart
- **lucide-react** for icons (the Figma file uses Lucide). Custom icons such as the mobile bottom-nav set are exported SVGs in `public/figma/`

## Getting started

Requires Node.js 20.9+.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start   # production build
npm run lint
```

There are no API keys or env vars to set. `NEXT_PUBLIC_API_BASE_URL` can optionally point at another DummyJSON-compatible host (defaults to `https://dummyjson.com`).

## Public APIs used

| API | Used for |
| --- | --- |
| [DummyJSON](https://dummyjson.com) `/users`, `/users/:id`, `/users/add`, `PUT/DELETE /users/:id` | Users directory, user detail, add / edit / delete user |
| DummyJSON `/carts`, `/carts/:id`, `/carts/user/:id` | Transactions (each cart is a transaction), customer ledger |
| DummyJSON `/todos`, `/todos/:id`, `/todos/user/:id`, `/todos/add` | Bookings (each todo is a booking), customer booking history |
| [randomuser.me portraits](https://randomuser.me) | Profile photos, picked by each DummyJSON user's id and gender |

DummyJSON has no admin roles, account status, transaction types or bookings. `src/lib/api/mappers.ts` turns its records into the models the design needs. Every derived field (status, dates, service, and so on) is seeded from the record id, so a record looks the same on every load. Dates are relative to today, so the dashboard always looks current.

DummyJSON doesn't save writes. Mutations send the real request and then apply the response to the TanStack Query cache, so changes show up immediately but are lost on reload.

## State management (Redux Toolkit)

`src/store/` holds only client/UI state, which the API knows nothing about:

- `uiSlice`: mobile drawer open/closed, active dashboard tab, revenue chart range, dashboard settings toggles
- `filtersSlice`: search, filter, sort and page for Users, Transactions and Bookings. Changing any filter resets that list to page 1. Because this lives in the store, filters survive moving to a detail page and back, and the top-bar search can set the Users search from any page.
- `selectionSlice`: bulk-selected user ids, plus role/status changes made by bulk actions (Change Role, Suspend, Reactivate)

Components use the typed `useAppSelector` / `useAppDispatch` hooks.

## Data fetching (TanStack Query)

- **API code is separate from the UI.** `src/lib/api/client.ts` wraps `fetch` and throws a typed `ApiError`. `endpoints.ts` calls DummyJSON and maps the results. `src/hooks/queries.ts` exposes one hook per resource with shared `queryKeys`.
- **Lists:** each collection is fetched once (`?limit=0`; at most 254 records) and cached for 5 minutes. `src/hooks/listings.ts` then filters, sorts and paginates it in memoized hooks driven by the Redux filters, so every combination of search, role, status, date, type and amount works together. DummyJSON can't combine these on the server.
- **Detail pages** start from the cached list (`initialData`), so moving from a table to a detail page is instant, then refresh from `/resource/:id`. A 404 is not retried and shows a "not found" state.
- **Joins:** transactions and bookings are joined to their customer through a memoized `Map` built from the cached users list.
- **Mutations** (`src/hooks/mutations.ts`): add / edit / delete user, refund transaction, cancel / reschedule booking. Each one updates both the list cache and the detail cache.

## UI states

Every data view handles:

- **Loading:** skeleton rows, cards and charts
- **Error:** message plus "Try again", which refetches
- **Empty:** for no records, and for "no matches" with a "Clear filters" action
- **Pagination:** Previous / Next are disabled at the first and last page
- **Disabled actions:** for example, Refund is disabled for refunds and non-completed payments, and Reschedule / Cancel for completed or cancelled bookings
- **Active / selected:** nav items, tabs, filter options, table row selection and the bulk-action bar

## Project structure

```
src/
  app/                    routes (App Router); (app)/ group shares the shell
  components/
    layout/               sidebar, top bar, mobile nav / drawer / bottom tabs
    ui/                   design-system primitives (badge, button, card, table, dialog…)
    dashboard/ users/ transactions/ bookings/   feature views
  hooks/                  queries, mutations, derived listings & stats
  lib/                    api client + mappers, formatters, csv export
  store/                  Redux Toolkit slices
  types/                  domain models
public/figma/             assets exported from the Figma file
```

## Notes on design fidelity

- Desktop and mobile layouts are built separately from the matching Figma frames. Mobile is a different layout, not a scaled-down desktop.
- Where the Figma file contradicts itself, the app follows the majority of frames. For example, the subtitle under the page title is 12px in most frames and 13px in a few.
- **Not copied from the design:**
  - the iOS status bar drawn in the mobile detail frames
  - rows outlined on all four sides in the mobile detail cards; they use a bottom divider like the desktop cards
  - an empty 36px button on mobile Transactions, which is now an Export CSV button
- Date filters default to "All Time" because the generated data spans several months.
