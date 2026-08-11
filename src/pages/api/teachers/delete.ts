export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request, redirect }) => {
  const data = await request.formData();
  const id = data.get('id');

  if (id) {
    try {
      const db = env.DB;
      await db.prepare('DELETE FROM teachers WHERE id = ?')
        .bind(id).run();
      
      return redirect('/teachers?success=deleted');
    } catch (e) {
      console.error(e);
    }
  }
  
  return redirect('/teachers?error=true');
};
