export const prerender = false;
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request, redirect }) => {
  const data = await request.formData();
  const id = Number(data.get('id'));

  if (id) {
    try {
      const db = env.DB;
      const trial: any = await db.prepare('SELECT * FROM trial_sessions WHERE id = ?').bind(id).first();
      if (!trial) {
        return new Response("Trial session not found", { status: 404 });
      }

      await db.prepare("UPDATE trial_sessions SET status = 'completed' WHERE id = ?").bind(id).run();

      const price = Number(trial.teacher_price) || 0;
      const teacherId = Number(trial.teacher_id);

      if (teacherId) {
        await db.prepare(`
          UPDATE teachers 
          SET sessions_completed = IFNULL(sessions_completed, 0) + 1, 
              balance = IFNULL(balance, 0) + ? 
          WHERE id = ?
        `).bind(price, teacherId).run();

        if (price > 0) {
          await db.prepare(`
            INSERT INTO teacher_transactions (teacher_id, change_type, amount, note) 
            VALUES (?, 'trial_session', ?, ?)
          `).bind(teacherId, price, `حصة تجريبية للطالب (${trial.student_name}) بمبلغ ${price} ريال`).run();
        }
      }

      return redirect('/?success=trial_completed');
    } catch (e: any) {
      return new Response("Error completing trial session: " + e.message, { status: 500 });
    }
  }

  return new Response("Missing parameters (id)", { status: 400 });
};
