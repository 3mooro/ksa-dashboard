import type { APIRoute } from 'astro';

export const GET: APIRoute = async (context) => {
  try {
    const db = context.locals.runtime?.env?.DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'DB not found' }), { status: 500 });
    }
    const settings = await db.prepare("SELECT * FROM site_settings WHERE id = 1").first();
    return new Response(JSON.stringify(settings), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
