import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { GoogleGenAI } from '@google/genai';
import { marked } from 'marked';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { title } = await request.json();
    if (!title) throw new Error("Title is required");
    if (!env.GEMINI_API_KEY) throw new Error("Gemini API Key missing in environment");

    const dataPrompt = `
You are an expert SEO copywriter for an educational platform in Saudi Arabia called "KSA Academy".
Write a comprehensive, highly engaging, and SEO-optimized blog post in Arabic about the following title:
"${title}"

Requirements:
1. Write 4-5 well-structured paragraphs.
2. Use markdown headings (H2, H3).
3. Include bullet points.
4. Keep the tone encouraging and professional.
5. At the end, include a call-to-action to join KSA Academy courses.

ALSO, provide a list of 3-5 tags relevant to this topic at the very end in this exact JSON array format:
TAGS: ["tag1", "tag2", "tag3"]
    `;

    const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    let response;
    let retries = 3;
    while (retries > 0) {
      try {
        response = await ai.models.generateContent({
            model: 'gemini-flash-latest',
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
    
    let text = response.text || "";
    let tags = [];
    
    // Extract tags
    const tagsMatch = text.match(/TAGS:\s*(\[.*?\])/s);
    if (tagsMatch) {
      try {
        tags = JSON.parse(tagsMatch[1]);
        text = text.replace(tagsMatch[0], '').trim();
      } catch (e) {
        console.error("Failed to parse tags", e);
      }
    }

    const htmlContent = marked.parse(text);

    return new Response(JSON.stringify({ content: htmlContent, tags }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
