export const prerender = false;
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request, redirect }) => {
  const data = await request.formData();
  const student_name = data.get('student_name')?.toString().trim();
  const student_phone = data.get('student_phone')?.toString().trim() || '';
  const teacher_id = Number(data.get('teacher_id'));
  const session_datetime = data.get('session_datetime')?.toString();
  const notes = data.get('notes')?.toString().trim() || '';
  const teacher_price = Number(data.get('teacher_price')) || 0;

  if (student_name && teacher_id && session_datetime) {
    try {
      const db = env.DB;
      
      // Ensure trial_sessions table exists
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

      await db.prepare(`
        INSERT INTO trial_sessions (student_name, student_phone, teacher_id, session_datetime, notes, teacher_price, status)
        VALUES (?, ?, ?, ?, ?, ?, 'scheduled')
      `).bind(student_name, student_phone, teacher_id, session_datetime, notes, teacher_price).run();

      return redirect('/?success=trial_scheduled');
    } catch (e: any) {
      return new Response("Error creating trial session: " + e.message, { status: 500 });
    }
  }

  return new Response("Missing parameters (student_name, teacher_id, or session_datetime)", { status: 400 });
};
