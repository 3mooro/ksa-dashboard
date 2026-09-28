import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request, redirect }) => {
  const data = await request.formData();
  const id = Number(data.get('id')); // The link ID from student_teacher
  const student_id = Number(data.get('student_id'));

  if (id && student_id) {
    try {
      const db = env.DB;
      await db.prepare('DELETE FROM student_teacher WHERE id = ?').bind(id).run();
      
      // Optionally delete weekly schedules related to this student/teacher link? No, we'll keep it simple or let the user delete manually.
      return redirect(`/students/${student_id}?success=unlinked`);
    } catch (e: any) {
      return new Response("Error in unlink-teacher: " + e.message, { status: 500 });
    }
  }
  
  return new Response("Missing parameters", { status: 400 });
};
