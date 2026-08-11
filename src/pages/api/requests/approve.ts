export const prerender = false;
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request, redirect }) => {
  const data = await request.formData();
  const subscription_id = data.get('subscription_id');
  const teacher_id = data.get('teacher_id');
  const sessions = data.get('sessions');

  if (subscription_id && teacher_id && sessions) {
    try {
      const db = env.DB;
      await db.prepare('UPDATE course_subscriptions SET teacher_id = ?, remaining_sessions = ?, total_sessions = ?, status = ? WHERE id = ?')
        .bind(teacher_id, sessions, sessions, 'active', subscription_id).run();
      
      return redirect('/students?success=approved');
    } catch (e) {
      console.error(e);
    }
  }
  
  return redirect('/requests?error=true');
};
