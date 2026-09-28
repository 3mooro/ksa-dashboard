import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request, redirect }) => {
  const data = await request.formData();
  const student_id = Number(data.get('student_id'));
  const teacher_id = Number(data.get('teacher_id'));
  const day_of_week = Number(data.get('day_of_week')); // 0-6
  const time_of_day = data.get('time_of_day'); // HH:mm

  if (student_id && teacher_id && time_of_day && !isNaN(day_of_week)) {
    try {
      const db = env.DB;
      await db.prepare('INSERT INTO weekly_schedule (student_id, teacher_id, day_of_week, time_of_day) VALUES (?, ?, ?, ?)')
        .bind(student_id, teacher_id, day_of_week, time_of_day).run();
      
      return redirect(`/students/${student_id}?success=scheduled`);
    } catch (e: any) {
      return new Response("Error in weekly-schedule: " + e.message, { status: 500 });
    }
  }
  
  return new Response("Missing parameters", { status: 400 });
};
