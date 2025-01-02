// filepath: app/api/test-gemini/route.ts
import { googleModel } from '@/lib/ai';
import { generateText } from 'ai';

export async function GET() {
    try {
        const response = await generateText({
            model: googleModel('gemini-2.0-flash-exp'),
            prompt: 'Hello, Gemini!',
        });
        console.log("Test API Response:", response);
        return Response.json(response);
    } catch (error) {
        console.error("Test API Error:", error);
        return new Response('Failed to generate text', { status: 500 });
    }
}