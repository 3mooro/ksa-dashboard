export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request, redirect }) => {
  const data = await request.formData();
  const id = data.get('id');

  if (id) {
    try {
      const db = env.DB;
      const teacher = await db.prepare('SELECT * FROM teachers WHERE id = ?').bind(id).first();
      
      if (teacher && teacher.sessions_completed > 0) {
        const totalAmount = teacher.sessions_completed * teacher.session_price;
        const sessionsToReset = teacher.sessions_completed;

        // Reset sessions
        await db.prepare('UPDATE teachers SET sessions_completed = 0 WHERE id = ?').bind(id).run();
        
        // Log transaction
        await db.prepare('INSERT INTO teacher_transactions (teacher_id, change_type, amount, note) VALUES (?, ?, ?, ?)')
          .bind(id, 'payout', -sessionsToReset, `تم دفع المستحقات: ${totalAmount} ريال عن ${sessionsToReset} حصة. وتصفير العداد.`).run();
      }
      
      return redirect('/teachers?success=paid');
    } catch (e) {
      console.error(e);
    }
  }
  
  return redirect('/teachers?error=true');
};
