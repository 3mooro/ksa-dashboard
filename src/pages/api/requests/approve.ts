export const prerender = false;
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

function normalizePhone(p: any): string {
  let d = String(p || '').replace(/\D/g, '');
  if (d.startsWith('966')) d = '0' + d.slice(3);
  if (d.length === 9 && d.startsWith('5')) d = '0' + d;
  return d;
}

function resolveGrade(stage: any, courseName: any): string {
  const cn = String(courseName || '');
  if (/قدرات|تحصيلي/.test(cn)) return 'قدرات وتحصيلي';
  const map: Record<string, string> = {
    'الابتدائية': 'ابتدائي', 'ابتدائي': 'ابتدائي',
    'المتوسطة': 'متوسط', 'متوسط': 'متوسط',
    'الثانوية': 'ثانوي', 'ثانوي': 'ثانوي',
    'الجامعية': 'جامعي', 'جامعي': 'جامعي',
  };
  const s = String(stage || '').trim();
  if (map[s]) return map[s];
  if (cn.includes('ابتدائي')) return 'ابتدائي';
  if (cn.includes('متوسط')) return 'متوسط';
  if (cn.includes('ثانوي')) return 'ثانوي';
  if (cn.includes('جامعي')) return 'جامعي';
  return 'متوسط';
}

export const POST: APIRoute = async ({ request, redirect }) => {
  const data = await request.formData();
  const subscription_id = data.get('subscription_id');
  const teacher_id = data.get('teacher_id');
  const sessions = data.get('sessions');

  if (subscription_id && teacher_id && sessions) {
    try {
      const db = env.DB;
      await db.prepare('UPDATE course_subscriptions SET teacher_id = ?, remaining_sessions = ?, total_sessions = ?, status = ? WHERE id = ?')
        .bind(teacher_id, sessions, sessions, 'active', subscription_id).run();

      // ===== Bridge: reflect the activation in the dashboard students system =====
      try {
        const sub: any = await db.prepare('SELECT * FROM course_subscriptions WHERE id = ?').bind(subscription_id).first();
        const account: any = sub ? await db.prepare('SELECT * FROM student_accounts WHERE id = ?').bind(sub.student_id).first() : null;

        if (sub && account) {
          try { await db.prepare('ALTER TABLE students ADD COLUMN site_account_id INTEGER').run(); } catch (e) {}

          let dashStudent: any = await db.prepare('SELECT * FROM students WHERE site_account_id = ?').bind(account.id).first();

          if (!dashStudent) {
            const target = normalizePhone(account.phone);
            const all = await db.prepare('SELECT id, phone FROM students').all();
            const match: any = (all.results || []).find((s: any) => normalizePhone(s.phone) === target);
            if (match) {
              await db.prepare('UPDATE students SET site_account_id = ? WHERE id = ?').bind(account.id, match.id).run();
              dashStudent = await db.prepare('SELECT * FROM students WHERE id = ?').bind(match.id).first();
            }
          }

          if (!dashStudent) {
            const grade = resolveGrade(account.stage, sub.course_name);
            const cnParts = String(sub.course_name || '').split(' - ');
            const gradeClass = (cnParts.length > 1 ? cnParts[cnParts.length - 1] : '') || account.grade || '';
            const ins: any = await db.prepare('INSERT INTO students (name, grade, grade_class, phone, status, site_account_id, total_sessions) VALUES (?, ?, ?, ?, ?, ?, 0) RETURNING id')
              .bind(account.name, grade, gradeClass, account.phone, 'نشط', account.id).first();
            dashStudent = { id: ins.id };
          }

          // Link the student with the assigned teacher
          const link = await db.prepare('SELECT id FROM student_teacher WHERE student_id = ? AND teacher_id = ?').bind(dashStudent.id, teacher_id).first();
          if (!link) {
            await db.prepare('INSERT INTO student_teacher (student_id, teacher_id) VALUES (?, ?)').bind(dashStudent.id, teacher_id).run();
          }

          // Credit the sessions balance + record the payment (same as manual add-payment)
          let amount = 0;
          try {
            const rec: any = await db.prepare('SELECT amount FROM payment_receipts WHERE subscription_id = ? ORDER BY id DESC LIMIT 1').bind(subscription_id).first();
            if (rec) amount = Number(rec.amount) || 0;
          } catch (e) {}

          await db.prepare('UPDATE students SET total_sessions = IFNULL(total_sessions, 0) + ? WHERE id = ?')
            .bind(Number(sessions), dashStudent.id).run();
          if (amount > 0) {
            await db.prepare('UPDATE students SET last_payment_amount = ?, last_payment_date = CURRENT_TIMESTAMP WHERE id = ?')
              .bind(amount, dashStudent.id).run();
          }
          await db.prepare('INSERT INTO payments_log (student_id, amount, sessions_added) VALUES (?, ?, ?)')
            .bind(dashStudent.id, amount, Number(sessions)).run();
        }
      } catch (e) {
        console.error('approve bridge error:', e);
      }

      return redirect('/students?success=approved');
    } catch (e) {
      console.error(e);
    }
  }

  return redirect('/requests?error=true');
};
