import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request, redirect }) => {
  const data = await request.formData();
  const id = Number(data.get('id'));

  if (id) {
    try {
      const db = env.DB;
      
      // Delete student links and schedules first
      await db.prepare('DELETE FROM student_teacher WHERE student_id = ?').bind(id).run();
      await db.prepare('DELETE FROM session_schedule WHERE student_id = ?').bind(id).run();
      await db.prepare('DELETE FROM weekly_schedule WHERE student_id = ?').bind(id).run();
      await db.prepare('DELETE FROM sessions_log WHERE student_id = ?').bind(id).run();
      await db.prepare('DELETE FROM payments_log WHERE student_id = ?').bind(id).run();
      
      // Finally delete the student
      await db.prepare('DELETE FROM students WHERE id = ?').bind(id).run();
      
      return redirect('/students?success=deleted');
    } catch (e: any) {
      return new Response("Error deleting student: " + e.message, { status: 500 });
    }
  }
  
  return new Response("Missing parameters", { status: 400 });
};
