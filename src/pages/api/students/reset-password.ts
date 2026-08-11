export const prerender = false;
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request, redirect }) => {
  const data = await request.formData();
  const student_id = data.get('student_id');
  const new_password = data.get('new_password');

  if (student_id && new_password) {
    try {
      const db = env.DB;
      await db.prepare('UPDATE student_accounts SET password = ? WHERE id = ?')
        .bind(new_password, student_id).run();
      
      return redirect('/students?success=password_reset');
    } catch (e) {
      console.error(e);
    }
  }
  
  return redirect('/students?error=true');
};
