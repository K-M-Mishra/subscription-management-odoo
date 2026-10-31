import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { config } from './config.js';
if (config.databasePath !== ':memory:')
  mkdirSync(path.dirname(config.databasePath), { recursive: true });
export const db = new DatabaseSync(config.databasePath);
db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, email TEXT NOT NULL COLLATE NOCASE UNIQUE, name TEXT NOT NULL, password TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('admin','staff','customer')), version INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS resets(hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS records(kind TEXT NOT NULL,id TEXT NOT NULL,customer_id TEXT,status TEXT,body TEXT NOT NULL CHECK(json_valid(body)),PRIMARY KEY(kind,id));
CREATE INDEX IF NOT EXISTS records_customer ON records(kind,customer_id);
CREATE INDEX IF NOT EXISTS records_status ON records(kind,status);
CREATE INDEX IF NOT EXISTS subscriptions_due ON records(json_extract(body,'$.nextBillingDate')) WHERE kind='subscriptions';
CREATE UNIQUE INDEX IF NOT EXISTS invoice_period ON records(json_extract(body,'$.subscriptionId'),json_extract(body,'$.period')) WHERE kind='invoices';
CREATE UNIQUE INDEX IF NOT EXISTS payment_key ON records(json_extract(body,'$.requestId')) WHERE kind='payments';
CREATE TABLE IF NOT EXISTS sequences(name TEXT PRIMARY KEY,value INTEGER NOT NULL);
`);
export const uid = () => randomUUID();
export const get = (kind, id) => {
  const row = db
    .prepare('SELECT body FROM records WHERE kind=? AND id=?')
    .get(kind, id);
  return row ? JSON.parse(row.body) : null;
};
export function all(kind, customerId) {
  const rows = customerId
    ? db
        .prepare(
          'SELECT body FROM records WHERE kind=? AND customer_id=? ORDER BY rowid DESC',
        )
        .all(kind, customerId)
    : db
        .prepare('SELECT body FROM records WHERE kind=? ORDER BY rowid DESC')
        .all(kind);
  return rows.map((row) => JSON.parse(row.body));
}
export function put(kind, value) {
  const item = { ...value, id: value.id || uid() };
  db.prepare(
    'INSERT INTO records(kind,id,customer_id,status,body) VALUES(?,?,?,?,?) ON CONFLICT(kind,id) DO UPDATE SET customer_id=excluded.customer_id,status=excluded.status,body=excluded.body',
  ).run(
    kind,
    item.id,
    item.customerId || null,
    item.status || null,
    JSON.stringify(item),
  );
  return item;
}
export function tx(fn) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
export function number(prefix) {
  const row = db
    .prepare(
      'INSERT INTO sequences(name,value) VALUES(?,1) ON CONFLICT(name) DO UPDATE SET value=value+1 RETURNING value',
    )
    .get(prefix);
  return `${prefix}-${String(row.value).padStart(5, '0')}`;
}
