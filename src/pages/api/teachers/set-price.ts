import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request, redirect }) => {
  const data = await request.formData();
  const teacher_id = data.get('teacher_id');
  const grade = data.get('grade');
  const price = data.get('price');

  if (teacher_id && grade && price) {
    try {
      const db = env.DB;
      // Delete existing price for this grade if exists
      await db.prepare('DELETE FROM teacher_prices WHERE teacher_id = ? AND grade = ?').bind(teacher_id, grade).run();
      // Insert new price
      await db.prepare('INSERT INTO teacher_prices (teacher_id, grade, price_per_session) VALUES (?, ?, ?)')
        .bind(teacher_id, grade, price).run();
      
      return redirect(`/teachers/${teacher_id}?success=price_set`);
    } catch (e) {
      console.error(e);
    }
  }
  
  return redirect(`/teachers/${teacher_id}?error=true`);
};
