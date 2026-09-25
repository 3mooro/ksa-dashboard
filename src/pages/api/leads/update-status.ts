import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request, redirect }) => {
  const data = await request.formData();
  const id = data.get('id');
  const status = data.get('status');

  if (id && status) {
    try {
      const db = env.DB;
      await db.prepare('UPDATE leads SET status = ? WHERE id = ?')
        .bind(status, id).run();
      
      return redirect('/leads?success=updated');
    } catch (e) {
      console.error(e);
    }
  }
  
  return redirect('/leads?error=true');
};
