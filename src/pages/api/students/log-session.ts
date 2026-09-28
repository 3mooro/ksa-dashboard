import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request, redirect }) => {
  const data = await request.formData();
  const schedule_id = data.get('schedule_id') ? Number(data.get('schedule_id')) : null;
  const student_id = Number(data.get('student_id'));
  const teacher_id = Number(data.get('teacher_id'));
  
  if (student_id && teacher_id) {
    try {
      const db = env.DB;
      
      const student = await db.prepare('SELECT grade, total_sessions FROM students WHERE id = ?').bind(student_id).first();
      if (!student) throw new Error("Student not found");
      
      if (student.total_sessions <= 0) {
        return redirect(`/students/${student_id}?error=no_sessions`);
      }

      let price = 0;
      const customPrice = await db.prepare('SELECT price_per_session FROM teacher_prices WHERE teacher_id = ? AND grade = ?').bind(teacher_id, student.grade).first();
      
      if (customPrice && customPrice.price_per_session) {
        price = Number(customPrice.price_per_session);
      } else {
        const teacher = await db.prepare('SELECT session_price FROM teachers WHERE id = ?').bind(teacher_id).first();
        price = teacher ? Number(teacher.session_price || 0) : 0;
      }

      if (schedule_id) {
        await db.prepare("UPDATE session_schedule SET status = 'completed' WHERE id = ?").bind(schedule_id).run();
      }

      await db.prepare('INSERT INTO sessions_log (student_id, teacher_id, status) VALUES (?, ?, ?)')
        .bind(student_id, teacher_id, 'حضر').run();
      
      await db.prepare('UPDATE students SET total_sessions = IFNULL(total_sessions, 0) - 1 WHERE id = ?')
        .bind(student_id).run();

      await db.prepare('UPDATE teachers SET sessions_completed = IFNULL(sessions_completed, 0) + 1, balance = IFNULL(balance, 0) + ? WHERE id = ?')
        .bind(price, teacher_id).run();
        
      await db.prepare("INSERT INTO teacher_transactions (teacher_id, change_type, amount, note) VALUES (?, 'session', ?, ?)")
        .bind(teacher_id, price, `حصة للطالب #${student_id} بمبلغ ${price} ريال`).run();

      return redirect(`/students/${student_id}?success=session_logged`);
    } catch (e: any) {
      return new Response("Error in log-session: " + e.message, { status: 500 });
    }
  }
  
  return new Response("Missing parameters", { status: 400 });
};
