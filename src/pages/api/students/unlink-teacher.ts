import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request, redirect }) => {
  const data = await request.formData();
  const id = Number(data.get('id')); // The link ID from student_teacher
  const student_id = Number(data.get('student_id'));
  const teacher_id = Number(data.get('teacher_id'));

  if (id || (student_id && teacher_id)) {
    try {
      const db = env.DB;
      
      let sId = student_id;
      let tId = teacher_id;

      // If teacher_id or student_id wasn't directly provided, fetch from student_teacher before deleting
      if (id && (!sId || !tId)) {
        const link: any = await db.prepare('SELECT student_id, teacher_id FROM student_teacher WHERE id = ?').bind(id).first();
        if (link) {
          sId = sId || Number(link.student_id);
          tId = tId || Number(link.teacher_id);
        }
      }

      // Delete the student-teacher link
      if (id) {
        await db.prepare('DELETE FROM student_teacher WHERE id = ?').bind(id).run();
      } else if (sId && tId) {
        await db.prepare('DELETE FROM student_teacher WHERE student_id = ? AND teacher_id = ?').bind(sId, tId).run();
      }

      // Delete all weekly recurring and one-off schedules between this student and teacher
      if (sId && tId) {
        await db.prepare('DELETE FROM weekly_schedule WHERE student_id = ? AND teacher_id = ?').bind(sId, tId).run();
        await db.prepare('DELETE FROM session_schedule WHERE student_id = ? AND teacher_id = ?').bind(sId, tId).run();
      }
      
      return redirect(`/students/${sId || student_id}?success=unlinked`);
    } catch (e: any) {
      return new Response("Error in unlink-teacher: " + e.message, { status: 500 });
    }
  }
  
  return new Response("Missing parameters", { status: 400 });
};
