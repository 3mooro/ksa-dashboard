import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request, redirect }) => {
  const data = await request.formData();
  const subscription_id = data.get('subscription_id');
  const discount_note = data.get('discount_note')?.toString() || '';

  if (!subscription_id) {
    return new Response('Missing required fields', { status: 400 });
  }

  const db = env.DB;
  if (!db) {
    return new Response('DB not configured', { status: 500 });
  }

  try {
    await db.prepare('UPDATE course_subscriptions SET discount_note = ? WHERE id = ?')
      .bind(discount_note, subscription_id)
      .run();

    return redirect('/students');
  } catch (e: any) {
    console.error(e);
    return new Response(e.message, { status: 500 });
  }
};
