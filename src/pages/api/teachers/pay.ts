import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request, redirect }) => {
  const data = await request.formData();
  const id = Number(data.get('id'));

  if (id) {
    try {
      const db = env.DB;
      const teacher = await db.prepare('SELECT * FROM teachers WHERE id = ?').bind(id).first();
      
      if (teacher && teacher.balance > 0) {
        const totalAmount = teacher.balance;
        const sessionsToReset = teacher.sessions_completed || 0;

        // Reset balance and sessions
        await db.prepare('UPDATE teachers SET sessions_completed = 0, balance = 0 WHERE id = ?').bind(id).run();
        
        // Log transaction
        await db.prepare('INSERT INTO teacher_transactions (teacher_id, change_type, amount, note) VALUES (?, ?, ?, ?)')
          .bind(id, 'payout', -totalAmount, `تم دفع المستحقات: ${totalAmount} ريال عن ${sessionsToReset} حصة. وتصفير العداد.`).run();
      }
      
      return redirect('/teachers?success=paid');
    } catch (e: any) {
      return new Response("Error in pay.ts: " + e.message, { status: 500 });
    }
  }
  
  return redirect('/teachers?error=true');
};
