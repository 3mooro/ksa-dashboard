import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request, redirect }) => {
  const data = await request.formData();
  const student_id = data.get('student_id');
  const amount = data.get('amount');
  const sessions_added = data.get('sessions_added');

  if (student_id && amount && sessions_added) {
    try {
      const db = env.DB;
      // Add to total_sessions in students
      await db.prepare('UPDATE students SET total_sessions = total_sessions + ?, last_payment_amount = ?, last_payment_date = CURRENT_TIMESTAMP WHERE id = ?')
        .bind(sessions_added, amount, student_id).run();
      
      // Log payment
      await db.prepare('INSERT INTO payments_log (student_id, amount, sessions_added) VALUES (?, ?, ?)')
        .bind(student_id, amount, sessions_added).run();
      
      return redirect(`/students/${student_id}?success=payment_added`);
    } catch (e) {
      console.error(e);
    }
  }
  
  return redirect(`/students/${student_id}?error=true`);
};
