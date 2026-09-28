import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request, redirect }) => {
  const data = await request.formData();
  const student_id = Number(data.get('student_id'));
  const amount = Number(data.get('amount'));
  const sessions_added = Number(data.get('sessions_added'));

  if (student_id && amount && sessions_added) {
    try {
      const db = env.DB;
      await db.prepare('UPDATE students SET total_sessions = IFNULL(total_sessions, 0) + ?, last_payment_amount = ?, last_payment_date = CURRENT_TIMESTAMP WHERE id = ?')
        .bind(sessions_added, amount, student_id).run();
      
      await db.prepare('INSERT INTO payments_log (student_id, amount, sessions_added) VALUES (?, ?, ?)')
        .bind(student_id, amount, sessions_added).run();
      
      return redirect(`/students/${student_id}?success=payment_added`);
    } catch (e: any) {
      return new Response("Error in add-payment: " + e.message, { status: 500 });
    }
  }
  
  return new Response("Missing parameters", { status: 400 });
};
