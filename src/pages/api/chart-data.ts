import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  try {
    const { env } = await import('cloudflare:workers');
    const db = env?.DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'DB not found' }), { status: 500 });
    }

    const url = new URL(request.url);
    const range = url.searchParams.get('range') || 'week'; // hour, week, month, year

    let query = '';
    
    if (range === 'hour') {
      // By hour for today
      query = "SELECT strftime('%H:00', visited_at) as label, COUNT(*) as count FROM visits_log WHERE date(visited_at) = date('now') GROUP BY label ORDER BY label ASC";
    } else if (range === 'week') {
      // By day for last 7 days
      query = "SELECT date(visited_at) as label, COUNT(*) as count FROM visits_log WHERE visited_at >= date('now', '-7 days') GROUP BY label ORDER BY label ASC";
    } else if (range === 'month') {
      // By month for this year
      query = "SELECT strftime('%Y-%m', visited_at) as label, COUNT(*) as count FROM visits_log WHERE strftime('%Y', visited_at) = strftime('%Y', 'now') GROUP BY label ORDER BY label ASC";
    } else if (range === 'year') {
      // By year
      query = "SELECT strftime('%Y', visited_at) as label, COUNT(*) as count FROM visits_log GROUP BY label ORDER BY label ASC";
    }

    const { results } = await db.prepare(query).all();

    return new Response(JSON.stringify({ data: results || [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
