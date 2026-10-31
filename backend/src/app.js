import express from 'express'
import cors from 'cors'
import { config } from './config.js'
import { query } from './db.js'
import routes from './routes/index.js'
import { errorHandler, HttpError } from './middleware/error.js'
const app = express()
app.use(cors({ origin: config.corsOrigin.split(',') }))
app.use(express.json({ limit: '1mb' }))
app.get('/api/v1/health', async (req, res) => {
  let db = false
  try { await query('SELECT 1'); db = true } catch {}
  res.json({ ok: true, db })
})
app.use('/api/v1', routes)
app.use((req, res, next) => next(new HttpError(404, 'not_found', 'This endpoint does not exist.')))
app.use(errorHandler)
export default app
