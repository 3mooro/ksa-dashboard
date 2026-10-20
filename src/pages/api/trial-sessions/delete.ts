export const prerender = false;
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request, redirect }) => {
  const data = await request.formData();
  const id = Number(data.get('id'));

  if (id) {
    try {
      const db = env.DB;
      await db.prepare('DELETE FROM trial_sessions WHERE id = ?').bind(id).run();
      return redirect('/?success=trial_cancelled');
    } catch (e: any) {
      return new Response("Error deleting trial session: " + e.message, { status: 500 });
    }
  }

  return new Response("Missing parameters (id)", { status: 400 });
};
