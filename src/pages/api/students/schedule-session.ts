import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request, redirect }) => {
  const data = await request.formData();
  const student_id = data.get('student_id');
  const teacher_id = data.get('teacher_id');
  const session_datetime = data.get('session_datetime'); // e.g., "2023-10-05T14:30"

  if (student_id && teacher_id && session_datetime) {
    try {
      const db = env.DB;
      await db.prepare('INSERT INTO session_schedule (student_id, teacher_id, session_datetime) VALUES (?, ?, ?)')
        .bind(student_id, teacher_id, session_datetime).run();
      
      return redirect(`/students/${student_id}?success=scheduled`);
    } catch (e) {
      console.error(e);
    }
  }
  
  return redirect(`/students/${student_id}?error=true`);
};
