import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request, redirect, cookies }) => {
  if (!cookies.has('admin_session')) return new Response('Unauthorized', { status: 401 });
  const data = await request.formData();
  const id = Number(data.get('id'));
  const name = data.get('name');
  const grade = data.get('grade');
  const phone = data.get('phone');

  if (id && name && grade && phone) {
    try {
      const db = env.DB;
      await db.prepare('UPDATE students SET name = ?, grade = ?, phone = ? WHERE id = ?')
        .bind(name, grade, phone, id).run();
      return redirect(`/students/${id}?success=updated`);
    } catch (e) {
      console.error(e);
    }
  }

  return redirect(id ? `/students/${id}?error=true` : '/students?error=true');
};
