// filepath: app/api/test-claude/route.ts
import { anthropicModel } from '@/lib/ai';
import { generateText } from 'ai';

export async function GET() {
    try {
        const response = await generateText({
            model: anthropicModel('claude-3-5-sonnet-20241022'),
            prompt: 'Hello, Claude!',
        });
        console.log("Test API Response:", response);
        return Response.json(response);
    } catch (error) {
        console.error("Test API Error:", error);
        return new Response('Failed to generate text', { status: 500 });
    }
}