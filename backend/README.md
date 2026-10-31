# Brightloop backend (Node + Express + PostgreSQL)

## Chalane ke liye
```
cd backend
cp .env.example .env
docker compose up -d      # Postgres (ya apna local Postgres; .env mein DATABASE_URL badlo)
npm install
npm run db:migrate        # docs/schema.sql chalata hai (db:reset = sab mitakar fresh)
npm run dev               # http://localhost:4000/api/v1/health
```
Frontend: `frontend/.env` mein `VITE_API_URL=http://localhost:4000/api/v1`

## Folder rule: ek banda = ek file
`src/routes/<module>.js` har module ka apna hai. Stub (501) ko apne code se replace karo; `routes/index.js` aur `app.js` mat chhedo.
Helper chahiye toh `src/services/<module>.service.js`.

## Pattern (copy karo)
```js
import { Router } from 'express'
import { z } from 'zod'
import { query } from '../db.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { wrap, pageParams, listResponse } from '../utils/http.js'
const router = Router()
router.use(requireAuth)

router.get('/', requireRole('admin', 'staff'), wrap(async (req, res) => {
  const p = pageParams(req.query)
  const { rows } = await query('SELECT * FROM taxes ORDER BY name LIMIT $1 OFFSET $2', [p.limit, p.offset])
  const { rows: [{ count }] } = await query('SELECT count(*)::int FROM taxes')
  res.json(listResponse(rows, count, p))
}))

const body = z.object({ name: z.string().min(1), rate_percent: z.number().min(0) })
router.post('/', requireRole('admin'), wrap(async (req, res) => {
  const d = body.parse(req.body)                 // galat data -> 422 apne aap
  const { rows } = await query('INSERT INTO taxes (name, rate_percent) VALUES ($1,$2) RETURNING *', [d.name, d.rate_percent])
  res.status(201).json(rows[0])
}))
export default router
```

## 5 niyam
1. Query hamesha parameterized (`$1, $2`), string jodkar kabhi nahi.
2. Har async handler `wrap(...)` mein. Galti par `throw new HttpError(404, 'not_found', 'Plain message')`.
3. Input `zod` se validate; role check `requireRole(...)` se. Frontend par bharosa nahi.
4. Paisa/total server calculate karta hai. Kai tables badalne wala kaam `tx(async c => {...})` mein.
5. Contract badalna ho toh pehle team ko batao.
