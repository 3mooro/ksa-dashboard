import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request, redirect }) => {
  const data = await request.formData();
  const name = data.get('name');
  const grade = data.get('grade');
  const phone = data.get('phone');

  if (name && grade && phone) {
    try {
      const db = env.DB;
      await db.prepare('INSERT INTO students (name, grade, phone, status) VALUES (?, ?, ?, ?)')
        .bind(name, grade, phone, 'نشط').run();
      
      return redirect('/students?success=added');
    } catch (e) {
      console.error(e);
    }
  }
  
  return redirect('/students?error=true');
};
