import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request, redirect }) => {
  const data = await request.formData();
  const schedule_id = data.get('schedule_id'); // if it's from schedule
  const student_id = data.get('student_id');
  const teacher_id = data.get('teacher_id');
  
  if (student_id && teacher_id) {
    try {
      const db = env.DB;
      
      // 1. Get Student Grade to find correct price
      const student = await db.prepare('SELECT grade, total_sessions FROM students WHERE id = ?').bind(student_id).first();
      if (!student) throw new Error("Student not found");
      
      if (student.total_sessions <= 0) {
        return redirect(`/students/${student_id}?error=no_sessions`);
      }

      // 2. Find Price (Check custom price first, then fallback to teacher's base price)
      let price = 0;
      const customPrice = await db.prepare('SELECT price_per_session FROM teacher_prices WHERE teacher_id = ? AND grade = ?').bind(teacher_id, student.grade).first();
      
      if (customPrice && customPrice.price_per_session) {
        price = customPrice.price_per_session;
      } else {
        const teacher = await db.prepare('SELECT session_price FROM teachers WHERE id = ?').bind(teacher_id).first();
        price = teacher ? (teacher.session_price || 0) : 0;
      }

      // 3. Mark schedule as completed (if applicable)
      if (schedule_id) {
        await db.prepare("UPDATE session_schedule SET status = 'completed' WHERE id = ?").bind(schedule_id).run();
      }

      // 4. Log the session
      await db.prepare('INSERT INTO sessions_log (student_id, teacher_id, status) VALUES (?, ?, ?)')
        .bind(student_id, teacher_id, 'حضر').run();
      
      // 5. Deduct from student
      await db.prepare('UPDATE students SET total_sessions = total_sessions - 1 WHERE id = ?')
        .bind(student_id).run();

      // 6. Credit Teacher (Add to balance and sessions_completed)
      await db.prepare('UPDATE teachers SET sessions_completed = sessions_completed + 1, balance = balance + ? WHERE id = ?')
        .bind(price, teacher_id).run();
        
      // 7. Add to teacher_transactions for history
      await db.prepare("INSERT INTO teacher_transactions (teacher_id, change_type, amount, note) VALUES (?, 'session', ?, ?)")
        .bind(teacher_id, price, `حصة للطالب #${student_id} بمبلغ ${price} ريال`).run();

      return redirect(`/students/${student_id}?success=session_logged`);
    } catch (e) {
      console.error(e);
    }
  }
  
  return redirect(`/students/${student_id}?error=true`);
};
