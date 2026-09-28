import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request, redirect }) => {
  const data = await request.formData();
  const student_id = Number(data.get('student_id'));
  const teacher_id = Number(data.get('teacher_id'));
  const session_datetime = data.get('session_datetime'); 

  if (student_id && teacher_id && session_datetime) {
    try {
      const db = env.DB;
      await db.prepare('INSERT INTO session_schedule (student_id, teacher_id, session_datetime) VALUES (?, ?, ?)')
        .bind(student_id, teacher_id, session_datetime).run();
      
      return redirect(`/students/${student_id}?success=scheduled`);
    } catch (e: any) {
      return new Response("Error in schedule-session: " + e.message, { status: 500 });
    }
  }
  
  return new Response("Missing parameters", { status: 400 });
};
