import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const GET: APIRoute = async () => {
  const db = env.DB;
  const queries = [
    `CREATE TABLE IF NOT EXISTS teachers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      subject TEXT,
      bio TEXT,
      experience TEXT,
      image TEXT,
      session_price REAL DEFAULT 0,
      sessions_completed INTEGER DEFAULT 0,
      balance REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS session_schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER,
      teacher_id INTEGER,
      session_datetime DATETIME NOT NULL,
      status TEXT DEFAULT 'scheduled',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS teacher_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teacher_id INTEGER,
      change_type TEXT,
      amount REAL,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`
  ];

  let results = [];
  try {
    for (const q of queries) {
      await db.prepare(q).run();
      results.push('Executed: ' + q.substring(0, 50));
    }
    try { await db.prepare('ALTER TABLE teachers ADD COLUMN balance REAL DEFAULT 0').run(); } catch(e) {}
    try { await db.prepare('ALTER TABLE teachers ADD COLUMN session_price REAL DEFAULT 0').run(); } catch(e) {}
    try { await db.prepare('ALTER TABLE teachers ADD COLUMN sessions_completed INTEGER DEFAULT 0').run(); } catch(e) {}
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message, results }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true, results }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
