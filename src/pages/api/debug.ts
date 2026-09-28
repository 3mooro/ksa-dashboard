import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const GET: APIRoute = async () => {
  const db = env.DB;
  
  const teachers = await db.prepare('SELECT * FROM teachers').all();
  
  return new Response(JSON.stringify({
    teachers: teachers.results
  }, null, 2), {
    headers: { 'Content-Type': 'application/json' }
  });
};
