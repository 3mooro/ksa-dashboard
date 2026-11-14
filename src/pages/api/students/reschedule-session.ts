import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

// تأجيل / تعديل موعد حصة:
// kind=scheduled -> تعديل صف موجود في session_schedule
// kind=trial     -> تعديل صف موجود في trial_sessions
// kind=weekly    -> تأجيل حدوث واحد فقط من الجدول الأسبوعي: نسجّل استثناء لتاريخ اليوم
//                   وننشئ حصة منفصلة في session_schedule بالموعد الجديد (الجدول الثابت لا يتغير)
export const POST: APIRoute = async ({ request, redirect, cookies }) => {
  if (!cookies.has('admin_session')) return new Response('Unauthorized', { status: 401 });

  const data = await request.formData();
  const kind = String(data.get('kind') || '');
  const newDatetime = String(data.get('new_datetime') || '').trim();

  if (!newDatetime) {
    return new Response('Missing new_datetime', { status: 400 });
  }

  try {
    const db = env.DB;

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS weekly_schedule_exceptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        teacher_id INTEGER,
        exception_date TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    if (kind === 'scheduled') {
      const id = Number(data.get('id'));
      if (!id) return new Response('Missing id', { status: 400 });
      await db.prepare("UPDATE session_schedule SET session_datetime = ? WHERE id = ? AND IFNULL(status, 'scheduled') = 'scheduled'")
        .bind(newDatetime, id).run();
    } else if (kind === 'trial') {
      const id = Number(data.get('id'));
      if (!id) return new Response('Missing id', { status: 400 });
      await db.prepare("UPDATE trial_sessions SET session_datetime = ? WHERE id = ? AND IFNULL(status, 'scheduled') = 'scheduled'")
        .bind(newDatetime, id).run();
    } else if (kind === 'weekly') {
      const studentId = Number(data.get('student_id'));
      const teacherId = Number(data.get('teacher_id'));
      const originalDate = String(data.get('original_date') || '').trim();
      if (!studentId || !teacherId || !originalDate) {
        return new Response('Missing parameters', { status: 400 });
      }
      await db.prepare('INSERT INTO weekly_schedule_exceptions (student_id, teacher_id, exception_date) VALUES (?, ?, ?)')
        .bind(studentId, teacherId, originalDate).run();
      await db.prepare('INSERT INTO session_schedule (student_id, teacher_id, session_datetime) VALUES (?, ?, ?)')
        .bind(studentId, teacherId, newDatetime).run();
    } else {
      return new Response('Unknown kind', { status: 400 });
    }

    return redirect('/?success=session_rescheduled');
  } catch (e: any) {
    return new Response('Error in reschedule-session: ' + e.message, { status: 500 });
  }
};
