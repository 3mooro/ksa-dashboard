import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const GET: APIRoute = async () => {
  const db = env.DB;
  const queries = [
    // Create new tables
    `CREATE TABLE IF NOT EXISTS teacher_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teacher_id INTEGER,
      grade TEXT NOT NULL,
      price_per_session REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS student_teacher (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER,
      teacher_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS sessions_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER,
      teacher_id INTEGER,
      session_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'حضر',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS payments_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER,
      amount REAL,
      sessions_added INTEGER,
      payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`
  ];

  let results = [];
  try {
    for (const q of queries) {
      await db.prepare(q).run();
      results.push('Executed: ' + q.substring(0, 50));
    }

    // Try adding columns to students table gracefully
    const cols = ['grade TEXT', 'total_sessions INTEGER DEFAULT 0', 'last_payment_date DATETIME', 'last_payment_amount REAL DEFAULT 0'];
    for (const col of cols) {
      try {
        await db.prepare(`ALTER TABLE students ADD COLUMN ${col}`).run();
        results.push(`Added col ${col}`);
      } catch (e: any) {
        results.push(`Col ${col} might exist: ` + e.message);
      }
    }

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message, results }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true, results }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
