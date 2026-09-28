import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request, redirect }) => {
  const data = await request.formData();
  const id = Number(data.get('id'));
  const price = Number(data.get('price')) || 0;

  if (id) {
    try {
      const db = env.DB;
      await db.prepare('UPDATE teachers SET sessions_completed = IFNULL(sessions_completed, 0) + 1, balance = IFNULL(balance, 0) + ? WHERE id = ?')
        .bind(price, id).run();
      
      await db.prepare("INSERT INTO teacher_transactions (teacher_id, change_type, amount, note) VALUES (?, 'session', ?, ?)")
        .bind(id, price, `تسجيل حصة يدوية بمبلغ ${price} ريال`).run();
      
      return redirect('/teachers?success=updated');
    } catch (e: any) {
      return new Response("Error: " + e.message, { status: 500 });
    }
  }
  
  return new Response("Missing parameters", { status: 400 });
};
