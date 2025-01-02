// app/api/test-perplexity/route.ts
    import { perplexityModel } from '@/lib/ai';
import { generateText } from 'ai';

export async function GET() {
    try {
        const response = await generateText({
            model: perplexityModel('llama-3.1-sonar-large-32k-online'),
            prompt: 'Hello, Perplexity!',
        });
        console.log("Test API Response:", response);
        return Response.json(response);
    } catch (error) {
        console.error("Test API Error:", error);
        return new Response('Failed to generate text', { status: 500 });
    }
}