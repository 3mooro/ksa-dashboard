export const prerender = false;
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request, redirect }) => {
  try {
    const data = await request.formData();
    const id = data.get('id');
    const session_price = data.get('session_price');

    if (id && session_price) {
      const db = env.DB;
      await db.prepare('UPDATE teachers SET status = ?, session_price = ? WHERE id = ?')
        .bind('active', session_price, id).run();
      
      return redirect('/teachers?success=approved');
    }
  } catch (e) {
    console.error("Error approving teacher:", e);
  }
  
  return redirect('/teachers?error=true');
};
