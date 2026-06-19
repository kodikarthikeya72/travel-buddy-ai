
# AI Travel Planner — V1 Plan

## Scope (V1 slice)
- Email/password auth (register, login, logout, protected routes)
- Create Trip form → Gemini → itinerary + budget + hotels saved to MongoDB
- Dashboard listing user's trips (search, delete)
- Trip Details page (read-only itinerary, budget, hotels)

**Deferred to V2:** editable itinerary (add/edit/remove activity), regenerate-day, PDF export, weather-aware smart insights, dark mode polish.

---

## Repo layout

This Lovable project already runs TanStack Start (React 19 + TS + Tailwind v4 + shadcn). Since you want a separate Express backend, I'll keep the frontend here and add a self-contained backend folder you deploy to Render independently.

```text
/ (this Lovable project — frontend, deploy to Vercel or Lovable)
├── src/
│   ├── routes/
│   │   ├── index.tsx              # landing → redirect to /login or /dashboard
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── _auth.tsx              # layout: guards children, reads JWT
│   │   ├── _auth.dashboard.tsx
│   │   ├── _auth.create-trip.tsx
│   │   └── _auth.trip.$id.tsx
│   ├── lib/
│   │   ├── api.ts                 # fetch wrapper, attaches Bearer token, VITE_API_URL
│   │   ├── auth.ts                # token storage, useAuth hook
│   │   └── queries.ts             # React Query hooks
│   └── components/                # TripCard, TripForm, ItineraryView, BudgetCards, HotelList, Navbar
│
└── backend/                       # standalone Node project, deploy to Render
    ├── src/
    │   ├── index.ts               # express bootstrap, cors, helmet, rate-limit
    │   ├── db.ts                  # mongoose connect
    │   ├── middleware/auth.ts     # JWT verify
    │   ├── middleware/error.ts    # global error handler
    │   ├── models/User.ts
    │   ├── models/Trip.ts
    │   ├── routes/auth.ts         # /register /login
    │   ├── routes/trips.ts        # CRUD + /generate
    │   ├── services/gemini.ts     # Gemini call + JSON parse + validation
    │   └── validators.ts          # zod schemas
    ├── package.json
    ├── tsconfig.json
    ├── .env.example
    └── README.md                  # local run + Render deploy steps
```

---

## Frontend
- React Query for all server state, `Authorization: Bearer <token>` injected via fetch wrapper.
- Token stored in `localStorage` (acceptable for JWT bearer flow; documented tradeoff).
- `_auth.tsx` layout: if no token, redirect to `/login`; else render `<Outlet />`.
- shadcn components: Button, Input, Select, Card, Skeleton, Sonner toasts, Dialog (delete confirm).
- Forms validated with `zod` + `react-hook-form`.
- Loading skeletons on dashboard/trip detail, empty state on dashboard, toast on errors.
- `VITE_API_URL` env var points to backend (Render URL in prod, `http://localhost:4000` in dev).

## Backend (Express + MongoDB + Gemini)
- Express 4, Mongoose, jsonwebtoken, bcrypt, zod, helmet, cors, express-rate-limit, express-mongo-sanitize.
- Mongoose schemas match your spec (User, Trip with `userId` indexed).
- Auth: bcrypt hash, JWT signed with `JWT_SECRET`, 7-day expiry.
- All `/api/trips/*` routes guarded by JWT middleware that sets `req.userId`; every query filters by `userId` so users only see their own trips.
- `POST /api/trips/generate`: validate input → call Gemini with the exact prompt from your spec → strict JSON parse + zod validation → save → return trip.
- Global error middleware returns `{ error: { message, code } }`; rate limit on `/api/auth/*` (10/min) and `/api/trips/generate` (20/hour).
- `.env`: `MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, `CORS_ORIGIN`, `PORT`.

## V1 endpoints
```text
POST /api/auth/register
POST /api/auth/login
GET  /api/trips
GET  /api/trips/:id
POST /api/trips/generate
DELETE /api/trips/:id
```
(Edit/regenerate endpoints land in V2.)

---

## Secrets & setup
You'll need:
1. A MongoDB Atlas connection string
2. A Google Gemini API key
3. A JWT secret (I'll generate one in `.env.example`)

These go in `backend/.env` locally and in Render's env vars in prod. Nothing needs to be added to Lovable secrets for V1 since the backend is separate.

After V1 is built, I'll give you a short README covering: `cd backend && npm i && npm run dev`, then Render deploy steps (new Web Service → connect repo → set env vars → build `npm i && npm run build`, start `npm start`), and the `VITE_API_URL` value to paste into the frontend.

## Design direction
Modern travel aesthetic: warm off-white background, deep teal primary, coral accent, Outfit (headings) + Inter (body) via `@fontsource`. Card-based dashboard, generous spacing, subtle shadows. Full design tokens defined in `src/styles.css` (no hardcoded colors in components).

## Out of scope for this plan
PDF export, editable itinerary, regenerate-day, weather insights, dark mode — confirmed deferred to V2 after you validate V1.
