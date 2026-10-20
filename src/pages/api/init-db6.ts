import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const GET: APIRoute = async () => {
  const db = env.DB;
  const results = [];
  
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS trial_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_name TEXT NOT NULL,
        student_phone TEXT,
        teacher_id INTEGER NOT NULL,
        session_datetime DATETIME NOT NULL,
        notes TEXT,
        teacher_price REAL DEFAULT 0,
        status TEXT DEFAULT 'scheduled',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    results.push('Created trial_sessions table successfully');
  } catch (e: any) {
    results.push('Error: ' + e.message);
  }

  return new Response(JSON.stringify({ success: true, results }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
