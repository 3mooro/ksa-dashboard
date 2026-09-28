import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const GET: APIRoute = async () => {
  const db = env.DB;
  const results = [];
  
  const columns = ['phone', 'bio', 'experience', 'image'];
  
  for (const col of columns) {
    try {
      await db.prepare(`ALTER TABLE teachers ADD COLUMN ${col} TEXT`).run();
      results.push(`Added ${col}`);
    } catch (e: any) {
      results.push(`Failed ${col}: ` + e.message);
    }
  }

  return new Response(JSON.stringify({ success: true, results }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
