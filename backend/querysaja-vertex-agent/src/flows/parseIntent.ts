import { ai, defaultModel } from '../lib/genkit';
import { z } from 'zod';

export const intentSchema = z.object({
    location: z.string(),
    budget_min: z.number().nullable(),
    budget_max: z.number().nullable(),
    poi: z.string().nullable(),
});

export async function parseIntent(query: string) {
    const { output } = await ai.generate({
        // This will now correctly use gemini-2.5-flash from your .env
        model: `vertexai/${defaultModel}`, 
        system: `You are a housing search assistant. Extract location, budget, and POI into strict JSON.`,
        prompt: query,
        output: { schema: intentSchema },
        config: { temperature: 0.1 }
    });
    
    if (!output) {
        throw new Error("Failed to parse intent");
    }
    
    return output;
}
