# Wayfare Backend

Express + MongoDB + JWT + Gemini API.

## Local development

```bash
cd backend
cp .env.example .env
# fill in MONGODB_URI, JWT_SECRET, GEMINI_API_KEY
npm install
npm run dev
```

Server runs on `http://localhost:4000`.

In the frontend (root of this project), add `VITE_API_URL=http://localhost:4000` to your `.env`.

## Endpoints (V1)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST   | /api/auth/register | – | Create user |
| POST   | /api/auth/login | – | Get JWT |
| GET    | /api/auth/me | bearer | Current user |
| GET    | /api/trips | bearer | List your trips |
| GET    | /api/trips/:id | bearer | Get one trip |
| POST   | /api/trips/generate | bearer | Generate via Gemini and save |
| DELETE | /api/trips/:id | bearer | Delete a trip |

All `/api/trips/*` routes filter by `userId` from the JWT — users can never read or delete another user's data.

## Deploy to Render

1. Push this `backend/` folder to a Git repo (can be the same monorepo or its own).
2. In Render, **New → Web Service** and connect the repo. Set **Root Directory** to `backend` if it's in a monorepo.
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Environment variables:
   - `MONGODB_URI` — your MongoDB Atlas connection string
   - `JWT_SECRET` — a long random string (e.g. `openssl rand -hex 32`)
   - `GEMINI_API_KEY` — from https://aistudio.google.com/apikey
   - `CORS_ORIGIN` — your deployed frontend URL (comma-separated for multiple)
   - `PORT` — Render injects this automatically
6. Deploy. Copy the resulting Render URL into the frontend as `VITE_API_URL`.

## Notes

- Passwords hashed with bcrypt (cost 10).
- JWT signed HS256, 7-day expiry.
- Helmet + CORS + express-mongo-sanitize enabled.
- Rate limits: 10/min on `/api/auth/*`, 20/hr on `/api/trips/generate`.
- V2 (deferred): editable itinerary, regenerate-day, PDF export, weather insights.