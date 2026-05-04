# Frontend (Vite + React + Tailwind)

Quick start:

```bash
cd frontend
npm install
npm run dev
```

Notes:
- Local dev: API defaults to `http://localhost:5000/api`. Production: set `VITE_API_BASE_URL` on Vercel.
- After `npm install`, run the dev server and open http://localhost:5173
- Auth token stored in `localStorage.token`.

### Vercel (avoid 404)

1. In the Vercel project, set **Root Directory** to the `frontend` folder (this repo is a monorepo: `…/inventory and asset management system/frontend`).
2. **Node.js Version** in Project Settings should be **20.19+** or **22.x** (required by Vite 7).
3. **Output Directory** should be `dist` (already set in `vercel.json`).
4. Add env var `VITE_API_BASE_URL` = your live API base URL including `/api`.
