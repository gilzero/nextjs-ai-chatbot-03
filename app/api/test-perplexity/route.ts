// filepath: app/api/test-perplexity/route.ts
import { perplexityModel } from '@/lib/ai';
import { generateText } from 'ai';
import { logError } from '@/lib/utils'; // Import the logging utility

export async function GET() {
    try {
        const response = await generateText({
            model: perplexityModel('llama-3.1-sonar-large-128k-online'),
            prompt: 'Hello, Perplexity!',
        });
        console.log("Test API Response:", response);
        return Response.json(response);
    } catch (error: any) {
        logError("Test API Error (Perplexity): Failed to generate text", error); // Log the error with the utility
        return new Response('Failed to generate text', { status: 500 });
    }
}