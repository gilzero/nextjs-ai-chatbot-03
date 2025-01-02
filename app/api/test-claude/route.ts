// filepath: app/api/test-claude/route.ts
import { anthropicModel } from '@/lib/ai';
import { generateText } from 'ai';
import { logError } from '@/lib/utils'; // Import the logging utility

export async function GET() {
    try {
        const response = await generateText({
            model: anthropicModel('claude-3-5-sonnet-20241022'),
            prompt: 'Hello, Claude!',
        });
        console.log("Test API Response:", response);
        return Response.json(response);
    } catch (error: any) {
        logError("Test API Error (Claude): Failed to generate text", error); // Log the error with the utility
        return new Response('Failed to generate text', { status: 500 });
    }
}