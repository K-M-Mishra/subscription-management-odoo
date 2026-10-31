import pg from 'pg'
import { config } from './config.js'
pg.types.setTypeParser(1700, v => parseFloat(v)) // NUMERIC -> number (paisa/rupaye JS number)
pg.types.setTypeParser(1082, v => v)             // DATE -> 'YYYY-MM-DD' string (timezone bug nahi)
export const pool = new pg.Pool({ connectionString: config.databaseUrl })
export const query = (text, params) => pool.query(text, params)
// Transaction helper: billing run jaise kaam ke liye. Error aaye toh sab rollback.
export async function tx(fn) {
  const c = await pool.connect()
  try { await c.query('BEGIN'); const r = await fn(c); await c.query('COMMIT'); return r }
  catch (e) { await c.query('ROLLBACK'); throw e }
  finally { c.release() }
}
