# Brightloop frontend

This is the active React/Vite application. The separate legacy `frontend/` directory is unused.

Run `npm run setup` and `npm run dev` from the repository root. Open http://127.0.0.1:5173. The Vite proxy forwards `/api` to localhost:4000. `npm run build` creates production files served by the backend with `npm start`.

For a separately hosted backend, set VITE_API_URL before building and configure backend CORS_ORIGIN and FRONTEND_URL. Hash routes support static frontend routing, but a running backend and persistent database remain required. GitHub Pages alone does not run the backend.

See [../REPAIR_GUIDE.md](../REPAIR_GUIDE.md) for file-by-file application, demo logins and validation.
