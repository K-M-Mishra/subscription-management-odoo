// npm run db:migrate -> docs/schema.sql chalata hai.  npm run db:reset -> sab mitakar fresh schema.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool } from '../src/db.js'
const file = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../docs/schema.sql')
try {
  if (process.argv.includes('--reset')) await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;')
  await pool.query(fs.readFileSync(file, 'utf8'))
  console.log('Schema applied.')
} catch (e) { console.error('Migration failed:', e.message); process.exitCode = 1 }
finally { await pool.end() }
