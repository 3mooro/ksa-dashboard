import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request, redirect, cookies }) => {
  // Authentication check
  if (!cookies.has('admin_session')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const data = await request.formData();
  const id = data.get('id');

  if (!id) {
    return new Response('ID is required', { status: 400 });
  }

  try {
    const db = env.DB;
    await db.prepare('DELETE FROM blog WHERE id = ?').bind(id).run();
    return redirect('/blog?deleted=true');
  } catch (e: any) {
    return new Response(e.message || 'Error deleting post', { status: 500 });
  }
};
