export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request, redirect }) => {
  const data = await request.formData();
  const name = data.get('name');
  const subject = data.get('subject');
  const session_price = data.get('session_price');
  const image = data.get('image');
  const bio = data.get('bio');
  const experience = data.get('experience');

  if (name && subject) {
    try {
      const db = env.DB;
      await db.prepare('INSERT INTO teachers (name, subject, session_price, image, bio, experience) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(name, subject, session_price || 0, image || '', bio || '', experience || '').run();
      
      return redirect('/teachers?success=added');
    } catch (e) {
      console.error(e);
    }
  }
  
  return redirect('/teachers?error=true');
};
