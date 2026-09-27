# VANVAS Environment Variables Reference

## Backend (`backend/.env`)

| Variable | Required | Description | Default / Example |
|---|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string or SQLite local database | `sqlite:///./vanvas.db` |
| `JWT_SECRET` | Yes | Secret key for signing JSON Web Tokens | `your-secret-key-change-in-production` |
| `PORT` | No | Server binding port for Render / production hosting | `8000` |
| `ALLOWED_ORIGINS` | No | Comma-separated list of permitted CORS frontend domains | `http://localhost:3000,https://vanvas.vercel.app` |
| `OPENAI_API_KEY` | Optional | API key for AI synthesis of travel descriptions | `sk-...` |
| `GOOGLE_PLACES_API_KEY`| Optional | API key for live external POI discovery enrichment | `AIza...` |
| `WEATHER_API_KEY` | Optional | Satellite weather API key (Open-Meteo works without key) | `...` |

---

## Frontend (`frontend/.env.local`)

| Variable | Required | Description | Default / Example |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Base URL pointing to the FastAPI backend API | `http://localhost:8000/api/v1` |
| `NEXT_PUBLIC_SITE_URL` | No | Public canonical URL for production SEO metadata | `https://vanvas.vercel.app` |
