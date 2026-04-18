import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ cookies, redirect }) => {
  // مسح الكوكي الخاص بجلسة الدخول
  cookies.delete('admin_session', { path: '/' });
  return redirect('/login');
};
