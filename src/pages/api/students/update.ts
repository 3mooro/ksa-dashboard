import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request, redirect, cookies }) => {
  if (!cookies.has('admin_session')) return new Response('Unauthorized', { status: 401 });
  const data = await request.formData();
  const id = data.get('id');
  const status = data.get('status');
  if (id && status) {
    const db = env.DB;
    await db.prepare('UPDATE leads SET status = ? WHERE id = ?').bind(status, id).run();
  }
  return redirect('/students?updated=true');
};