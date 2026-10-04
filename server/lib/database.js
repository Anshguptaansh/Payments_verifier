// ============================================================
// database.js — SQLite Database Setup & Query Helpers
// ============================================================
// This module sets up a SQLite database using Node.js's built-in
// node:sqlite module (DatabaseSync). No external packages needed!
//
// WHY SQLite?
//   - File-based: creates a payments.db file, zero server setup
//   - Persistent: data survives server restarts (unlike in-memory)
//   - Real SQL: you write actual CREATE TABLE, INSERT, SELECT
//
// WHERE IT FITS:
//   Express Backend → [database.js] → payments.db file
//   Both REST API routes and Webhook routes call these helpers
//   to create and update payment records.
// ============================================================

import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory of the server folder so the .db file lives there
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, '..', 'payments.db');

// Open (or create) the SQLite database file
// DatabaseSync is synchronous — simple to use, no callbacks or promises
const db = new DatabaseSync(DB_PATH);

// ---- TABLE CREATION ----
// This runs every time the server starts.
// "IF NOT EXISTS" ensures it won't error if the table already exists.
db.exec(`
  CREATE TABLE IF NOT EXISTS payments (
    id          TEXT PRIMARY KEY,
    amount      REAL NOT NULL,
    product     TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'created',
    event_type  TEXT DEFAULT 'payment.created',
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
  )
`);

console.log('[Database] SQLite connected. payments table ready.');

// ---- HELPER FUNCTIONS ----
// These are the ONLY ways the rest of the app interacts with the database.
// This is called "separation of concerns" — routes don't write SQL directly.

/**
 * Create a new payment record.
 * Called when a customer initiates a payment via POST /api/payments.
 */
export function createPayment({ id, amount, product }) {
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO payments (id, amount, product, status, event_type, created_at, updated_at)
    VALUES (?, ?, ?, 'created', 'payment.created', ?, ?)
  `);
  stmt.run(id, amount, product, now, now);

  return getPaymentById(id);
}

/**
 * Update a payment's status and event type.
 * Called when a webhook arrives from the Fake Payment Provider.
 */
export function updatePayment(id, { status, eventType }) {
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    UPDATE payments
    SET status = ?, event_type = ?, updated_at = ?
    WHERE id = ?
  `);
  stmt.run(status, eventType, now, id);

  return getPaymentById(id);
}

/**
 * Get a single payment by its ID.
 */
export function getPaymentById(id) {
  const stmt = db.prepare('SELECT * FROM payments WHERE id = ?');
  return stmt.get(id);
}

/**
 * Get all payments, newest first.
 * Used by GET /api/payments and the admin dashboard.
 */
export function getAllPayments() {
  const stmt = db.prepare('SELECT * FROM payments ORDER BY created_at DESC');
  return stmt.all();
}
