import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request, redirect }) => {
  const data = await request.formData();
  const name = data.get('name');
  const grade = data.get('grade');
  const gradeClass = data.get('grade_class');
  const phone = data.get('phone');

  if (name && grade && phone) {
    try {
      const db = env.DB;
      try { await db.prepare('ALTER TABLE students ADD COLUMN grade_class TEXT').run(); } catch(e) {}
      await db.prepare('INSERT INTO students (name, grade, grade_class, phone, status) VALUES (?, ?, ?, ?, ?)')
        .bind(name, grade, gradeClass || '', phone, 'نشط').run();

      return redirect('/students?success=added');
    } catch (e) {
      console.error(e);
    }
  }

  return redirect('/students?error=true');
};
