import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { GoogleGenAI } from '@google/genai';

export const POST: APIRoute = async () => {
  try {
    const db = env.DB;
    if (!db) throw new Error("Database not connected");
    if (!env.GEMINI_API_KEY) throw new Error("Gemini API Key missing in environment (wrangler.json/secrets)");

    // Gather Stats
    const statsResult = await db.prepare("SELECT * FROM site_stats WHERE id = 'global'").first();
    const { count: teachersCount } = await db.prepare("SELECT COUNT(*) as count FROM teachers").first();
    const { count: studentsCount } = await db.prepare("SELECT COUNT(*) as count FROM students").first();
    const { count: leadsCount } = await db.prepare("SELECT COUNT(*) as count FROM leads").first();

    const dataPrompt = `
You are the AI Co-founder and Data Analyst of "KSA Academy" (أكاديمية KSA), a leading educational platform in Saudi Arabia.
Here are the current statistics of the platform:
- Total Website Visits: ${statsResult?.total_visits || 0}
- Total WhatsApp Clicks: ${statsResult?.whatsapp_clicks || 0}
- Total Students Enrolled: ${studentsCount || 0}
- Total Teachers: ${teachersCount || 0}
- Total Leads (Contact Form Submissions): ${leadsCount || 0}

Please provide a highly professional, encouraging, and structured report IN ARABIC.
Your report should include:
1. **تحليل الأداء (Performance Analysis):** Analyze the conversion rates (e.g., Visits vs WhatsApp Clicks, Visits vs Leads).
2. **نصائح بيعية وتنظيمية (Sales & Organizational Tips):** Give 2-3 concrete tips on how to improve these numbers based on the data.
3. **أفكار مقالات (Content/SEO Ideas):** Suggest 3 highly optimized blog post titles related to Saudi education (Qiyas, Tahsili, School subjects) that can drive more traffic.

Format the output strictly in beautiful Markdown.
    `;

    const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    let response;
    let retries = 3;
    while (retries > 0) {
      try {
        response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: dataPrompt,
        });
        break;
      } catch (err: any) {
        if (err.status === 503 || err.message?.includes('high demand') || err.message?.includes('503')) {
          retries--;
          if (retries === 0) throw err;
          await new Promise(res => setTimeout(res, 2500));
        } else {
          throw err;
        }
      }
    }
    
    if (!response) throw new Error("Failed to generate content");

    return new Response(JSON.stringify({ report: response.text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
