import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request, redirect }) => {
  const data = await request.formData();
  const student_id = data.get('student_id');
  const teacher_id = data.get('teacher_id');

  if (student_id && teacher_id) {
    try {
      const db = env.DB;
      // Log the session
      await db.prepare('INSERT INTO sessions_log (student_id, teacher_id, status) VALUES (?, ?, ?)')
        .bind(student_id, teacher_id, 'حضر').run();
      
      // Deduct from student
      await db.prepare('UPDATE students SET total_sessions = total_sessions - 1 WHERE id = ?')
        .bind(student_id).run();

      // Add to teacher's completed sessions if this column exists, we can assume it does based on teachers/index.astro logic
      // Note: older teachers/index.astro used sessions_completed, we might need to add it or it exists.
      try {
        await db.prepare('UPDATE teachers SET sessions_completed = sessions_completed + 1 WHERE id = ?')
          .bind(teacher_id).run();
      } catch(e) {
        // Ignore if column doesn't exist
      }
      
      return redirect(`/students/${student_id}?success=session_logged`);
    } catch (e) {
      console.error(e);
    }
  }
  
  return redirect(`/students/${student_id}?error=true`);
};
