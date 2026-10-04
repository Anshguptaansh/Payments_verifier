// db-viewer.js — Script to view all rows in SQLite database
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'payments.db');

try {
  const db = new DatabaseSync(dbPath);
  const rows = db.prepare('SELECT * FROM payments ORDER BY created_at DESC').all();

  console.log('\n=============================================================');
  console.log(`  📂 SQLite Database Viewer (${dbPath})`);
  console.log('=============================================================');
  
  if (rows.length === 0) {
    console.log('  (Database is empty. Make a payment on http://localhost:5173/customer)');
  } else {
    console.table(rows);
  }
  console.log(`  Total Rows: ${rows.length}\n`);
} catch (err) {
  console.error('Error reading database:', err.message);
}
