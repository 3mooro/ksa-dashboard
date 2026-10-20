export const prerender = false;
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request, redirect }) => {
  const data = await request.formData();
  const id = Number(data.get('id'));
  const grade = data.get('grade')?.toString().trim() || 'غير محدد';
  const total_sessions = Number(data.get('total_sessions')) || 0;

  if (id) {
    try {
      const db = env.DB;
      const trial: any = await db.prepare('SELECT * FROM trial_sessions WHERE id = ?').bind(id).first();
      if (!trial) {
        return new Response("Trial session not found", { status: 404 });
      }

      // 1. Create student in students table
      const studentRes = await db.prepare(`
        INSERT INTO students (name, phone, grade, total_sessions, status)
        VALUES (?, ?, ?, ?, 'نشط')
      `).bind(trial.student_name, trial.student_phone || '', grade, total_sessions).run();

      const newStudentId = studentRes.meta?.last_row_id;

      // 2. Link student with teacher
      if (newStudentId && trial.teacher_id) {
        await db.prepare(`
          INSERT INTO student_teacher (student_id, teacher_id)
          VALUES (?, ?)
        `).bind(newStudentId, trial.teacher_id).run();
      }

      // 3. Mark trial session as converted
      await db.prepare("UPDATE trial_sessions SET status = 'converted' WHERE id = ?").bind(id).run();

      if (newStudentId) {
        return redirect(`/students/${newStudentId}?success=converted_from_trial`);
      }
      return redirect('/students?success=converted');
    } catch (e: any) {
      return new Response("Error converting trial student: " + e.message, { status: 500 });
    }
  }

  return new Response("Missing parameters (id)", { status: 400 });
};
