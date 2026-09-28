import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const GET: APIRoute = async () => {
  const db = env.DB;
  const results = [];
  
  try {
    await db.prepare(`ALTER TABLE teachers ADD COLUMN status TEXT DEFAULT 'active'`).run();
    results.push(`Added status column to teachers`);
  } catch (e: any) {
    results.push(`Failed to add status column: ` + e.message);
  }

  // Update existing teachers to active if they are null
  try {
    await db.prepare(`UPDATE teachers SET status = 'active' WHERE status IS NULL`).run();
    results.push(`Updated existing teachers to active`);
  } catch (e: any) {
    results.push(`Failed to update existing teachers: ` + e.message);
  }

  return new Response(JSON.stringify({ success: true, results }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
