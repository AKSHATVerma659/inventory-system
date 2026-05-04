# Frontend (Vite + React + Tailwind)

Quick start:

```bash
cd frontend
npm install
npm run dev
```

Notes:
- Local dev: backend at `http://localhost:5000` (default API base).
- Production: set `VITE_API_BASE_URL` on Vercel (full URL including `/api`, e.g. `https://api.example.com/api`). See `.env.example`.
- After `npm install`, run the dev server and open http://localhost:5173
- Auth token stored in `localStorage.token`.

### Deploy on Vercel

1. Import the GitHub repo in Vercel.
2. Set **Root Directory** to `frontend`.
3. Add environment variable `VITE_API_BASE_URL` pointing at your live API.
4. On your API server, set `FRONTEND_BASE_URL` to your Vercel site URL (comma-separated for multiple previews if needed).
