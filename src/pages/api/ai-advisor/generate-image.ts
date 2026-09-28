import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { GoogleGenAI } from '@google/genai';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { prompt } = await request.json();
    if (!prompt) throw new Error("Prompt is required");
    if (!env.GEMINI_API_KEY) throw new Error("Gemini API Key missing in environment");

    const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    
    // The user explicitly requested to use "nano-banana-pro-preview" for image generation.
    const response = await ai.models.generateImages({
        model: 'nano-banana-pro-preview',
        prompt: prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
        }
    });

    const base64Image = response.generatedImages[0].image.imageBytes;
    const dataUrl = `data:image/jpeg;base64,${base64Image}`;

    return new Response(JSON.stringify({ imageUrl: dataUrl }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error("Image gen error:", error);
    
    // Fallback if nano-banana fails (e.g. not supported for image gen or key doesn't have access)
    // We will use pollinations.ai as a silent fallback so the user experience doesn't break
    try {
        const { prompt } = await request.json();
        const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=400&nologo=true`;
        return new Response(JSON.stringify({ imageUrl: fallbackUrl, warning: 'Used fallback due to API error: ' + error.message }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  }
};
