import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request, redirect }) => {
  const data = await request.formData();
  const student_id = data.get('student_id');

  if (!student_id) {
    return new Response('Missing required fields', { status: 400 });
  }

  const db = env.DB;
  if (!db) {
    return new Response('DB not configured', { status: 500 });
  }

  try {
    // Delete the student's subscriptions first
    await db.prepare('DELETE FROM course_subscriptions WHERE student_id = ?').bind(student_id).run();
    // Delete the student account
    await db.prepare('DELETE FROM student_accounts WHERE id = ?').bind(student_id).run();

    return redirect('/students');
  } catch (e: any) {
    console.error(e);
    return new Response(e.message, { status: 500 });
  }
};
