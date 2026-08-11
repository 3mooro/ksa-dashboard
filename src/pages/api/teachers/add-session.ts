export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request, redirect }) => {
  const data = await request.formData();
  const id = data.get('id');

  if (id) {
    try {
      const db = env.DB;
      await db.prepare('UPDATE teachers SET sessions_completed = sessions_completed + 1 WHERE id = ?')
        .bind(id).run();
      
      await db.prepare('INSERT INTO teacher_transactions (teacher_id, change_type, amount, note) VALUES (?, ?, ?, ?)')
        .bind(id, 'session_logged', 1, 'تسجيل حصة يدوياً من لوحة التحكم').run();
      
      return redirect('/teachers?success=updated');
    } catch (e) {
      console.error(e);
    }
  }
  
  return redirect('/teachers?error=true');
};
