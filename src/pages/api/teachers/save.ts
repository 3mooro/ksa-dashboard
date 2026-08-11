export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request, redirect }) => {
  const data = await request.formData();
  const name = data.get('name');
  const subject = data.get('subject');
  const session_price = data.get('session_price');

  if (name && subject) {
    try {
      const db = env.DB;
      await db.prepare('INSERT INTO teachers (name, subject, session_price) VALUES (?, ?, ?)')
        .bind(name, subject, session_price || 0).run();
      
      return redirect('/teachers?success=added');
    } catch (e) {
      console.error(e);
    }
  }
  
  return redirect('/teachers?error=true');
};
