import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request, redirect }) => {
  const data = await request.formData();
  const id = Number(data.get('id'));
  const student_id = Number(data.get('student_id'));

  if (id && student_id) {
    try {
      const db = env.DB;
      await db.prepare('DELETE FROM weekly_schedule WHERE id = ?')
        .bind(id).run();
      
      return redirect(`/students/${student_id}?success=deleted`);
    } catch (e: any) {
      return new Response("Error: " + e.message, { status: 500 });
    }
  }
  return new Response("Missing parameters", { status: 400 });
};
