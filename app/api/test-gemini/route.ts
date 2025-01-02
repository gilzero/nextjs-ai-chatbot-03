// filepath: app/api/test-gemini/route.ts
import { googleModel } from '@/lib/ai';
import { generateText } from 'ai';
import { logError } from '@/lib/utils'; // Import the logging utility

export async function GET() {
    try {
        const response = await generateText({
            model: googleModel('gemini-2.0-flash-exp'),
            prompt: 'Hello, Gemini!',
        });
        console.log("Test API Response:", response);
        return Response.json(response);
    } catch (error: any) {
        logError("Test API Error (Gemini): Failed to generate text", error); // Log the error with the utility
        return new Response('Failed to generate text', { status: 500 });
    }
}