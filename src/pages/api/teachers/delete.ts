export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request, redirect }) => {
  const data = await request.formData();
  const id = data.get('id');

  if (id) {
    try {
      const db = env.DB;
      await db.prepare('DELETE FROM student_teacher WHERE teacher_id = ?').bind(id).run();
      await db.prepare('DELETE FROM weekly_schedule WHERE teacher_id = ?').bind(id).run();
      await db.prepare('DELETE FROM session_schedule WHERE teacher_id = ?').bind(id).run();
      await db.prepare('DELETE FROM teacher_prices WHERE teacher_id = ?').bind(id).run();
      await db.prepare('DELETE FROM teachers WHERE id = ?').bind(id).run();
      
      return redirect('/teachers?success=deleted');
    } catch (e: any) {
      return new Response("Error deleting teacher: " + e.message, { status: 500 });
    }
  }
  
  return redirect('/teachers?error=true');
};
