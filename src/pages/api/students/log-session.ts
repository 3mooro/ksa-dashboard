export const prerender = false;
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request, redirect }) => {
  const data = await request.formData();
  const subscription_id = data.get('subscription_id');
  const teacher_id = data.get('teacher_id');

  if (subscription_id && teacher_id) {
    try {
      const db = env.DB;
      // Decrement remaining sessions for the student
      await db.prepare('UPDATE course_subscriptions SET remaining_sessions = remaining_sessions - 1 WHERE id = ? AND remaining_sessions > 0')
        .bind(subscription_id).run();
      
      // Increment completed sessions for the teacher
      await db.prepare('UPDATE teachers SET sessions_completed = sessions_completed + 1 WHERE id = ?')
        .bind(teacher_id).run();
      
      const subInfo = await db.prepare('SELECT course_name, student_id FROM course_subscriptions WHERE id = ?').bind(subscription_id).first();
      const courseName = subInfo?.course_name || 'غير معروف';

      await db.prepare('INSERT INTO teacher_transactions (teacher_id, change_type, amount, note) VALUES (?, ?, ?, ?)')
        .bind(teacher_id, 'session_logged', 1, `تسجيل حصة للطالب في كورس: ${courseName}`).run();
      
      return redirect('/students?success=logged');
    } catch (e) {
      console.error(e);
    }
  }
  
  return redirect('/students?error=true');
};
