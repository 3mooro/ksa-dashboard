import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request, redirect }) => {
  const data = await request.formData();
  const student_id = data.get('student_id');
  const teacher_id = data.get('teacher_id');

  if (student_id && teacher_id) {
    try {
      const db = env.DB;
      // Check if link already exists
      const exists = await db.prepare('SELECT id FROM student_teacher WHERE student_id = ? AND teacher_id = ?').bind(student_id, teacher_id).first();
      if (!exists) {
        await db.prepare('INSERT INTO student_teacher (student_id, teacher_id) VALUES (?, ?)')
          .bind(student_id, teacher_id).run();
      }
      return redirect(`/students/${student_id}?success=linked`);
    } catch (e) {
      console.error(e);
    }
  }
  
  return redirect(`/students/${student_id}?error=true`);
};
