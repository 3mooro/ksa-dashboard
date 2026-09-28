import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  try {
    const { env } = await import('cloudflare:workers');
    const db = env?.DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'DB not found', data: [] }), { status: 500 });
    }

    const url = new URL(request.url);
    const range = url.searchParams.get('range') || 'week';

    let query = '';
    
    if (range === 'hour') {
      query = "SELECT strftime('%H:00', datetime(visited_at, '+3 hours')) as label, COUNT(*) as count FROM visits_log WHERE date(datetime(visited_at, '+3 hours')) = date(datetime('now', '+3 hours')) GROUP BY label ORDER BY label ASC";
    } else if (range === 'week') {
      query = "SELECT date(datetime(visited_at, '+3 hours')) as label, COUNT(*) as count FROM visits_log WHERE datetime(visited_at, '+3 hours') >= date(datetime('now', '+3 hours'), '-7 days') GROUP BY label ORDER BY label ASC";
    } else if (range === 'month') {
      query = "SELECT strftime('%Y-%m', datetime(visited_at, '+3 hours')) as label, COUNT(*) as count FROM visits_log WHERE strftime('%Y', datetime(visited_at, '+3 hours')) = strftime('%Y', datetime('now', '+3 hours')) GROUP BY label ORDER BY label ASC";
    } else if (range === 'year') {
      query = "SELECT strftime('%Y', datetime(visited_at, '+3 hours')) as label, COUNT(*) as count FROM visits_log GROUP BY label ORDER BY label ASC";
    }

    try {
      const { results } = await db.prepare(query).all();
      return new Response(JSON.stringify({ data: results || [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (dbError: any) {
      // If table doesn't exist, just return empty data
      return new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error: any) {
    return new Response(JSON.stringify({ data: [], error: error.message }), { status: 500 });
  }
};
