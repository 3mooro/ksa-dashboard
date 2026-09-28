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
1. Write 4-5 well-structured paragraphs in Arabic.
2. Use markdown headings (H2, H3).
3. Include bullet points.
4. Keep the tone encouraging and professional.
5. At the end, include a call-to-action to join KSA Academy courses.

You MUST return the output strictly as a valid JSON object with the following keys, and NO OTHER TEXT OR MARKDOWN OUTSIDE THE JSON:
{
  "content": "The full markdown article in Arabic here...",
  "tags": ["tag1", "tag2", "tag3"],
  "slug": "english-url-slug-for-the-title",
  "description": "A powerful Arabic SEO meta description for this article (max 150 chars).",
  "imageAlt": "A descriptive Arabic alt text for the hero image of this article.",
  "imagePrompt": "A highly detailed English prompt to generate an AI image for this article. No text in the image."
}
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
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsed = JSON.parse(text);
    const htmlContent = marked.parse(parsed.content);

    return new Response(JSON.stringify({ 
      content: htmlContent, 
      tags: parsed.tags || [],
      slug: parsed.slug || 'article-' + Date.now(),
      description: parsed.description || '',
      imageAlt: parsed.imageAlt || title,
      imagePrompt: parsed.imagePrompt || 'education abstract concept'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
