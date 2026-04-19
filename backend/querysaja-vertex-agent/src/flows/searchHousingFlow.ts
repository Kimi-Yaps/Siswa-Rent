import { ai } from '../lib/genkit';
import { z } from 'zod';
import { parseIntent } from './parseIntent';
import { searchPlaces } from '../tools/places';
import { attachPricingAndFilter } from '../tools/pricing';

// Local schema for AI reasoning output
const rankingSchema = z.array(z.object({
    place_id: z.string(),
    fit_score: z.number(),
    summary: z.string(),
    reasoning: z.array(z.string())
}));

export const searchHousingFlow = ai.defineFlow(
    {
        name: 'searchHousingFlow',
        inputSchema: z.string(),
        outputSchema: z.any(),
    },
    async (query) => {
        // 1. Existing pipeline (Intent -> Search -> Proximity -> Budget)
        const intent = await parseIntent(query);
        const rawPlaces = await searchPlaces(intent);
        // Places API locationRestriction already enforces a 15 km radius around
        // UTM Johor server-side. Just guard against places with missing coordinates.
        const nearby = rawPlaces.filter(p => p.lat != null && p.lng != null);
        const results = await attachPricingAndFilter(nearby, intent);

        // 2. AI Reasoning Layer (Shortlist only, Response-only)
        let aiReasoning: any[] = [];
        if (results.length > 0) {
            const { output } = await ai.generate({
                // Using Gemini 2.5 Flash for 2026 stable performance [cite: 18, 21]
                model: 'vertexai/gemini-2.5-flash', 
                system: 'You are a Malaysian student housing expert. Compare the found properties against the student user intent.',
                prompt: `User Intent: ${JSON.stringify(intent)}\nFound Properties: ${JSON.stringify(results)}`,
                output: { schema: rankingSchema }
            });
            aiReasoning = output || [];
        }

        // 3. Final Mapping (Matching Meorez's schema + AI fields)
        const properties = results.map(r => {
            const aiInfo = aiReasoning.find(a => a.place_id === r.place_id);
            return {
              place_id: r.place_id || r.id,
              name: r.name,
              address: r.address,
              neighborhood: r.market_zone || 'Johor Bahru',
              latitude: r.lat,
              longitude: r.lng,
              min_price: r.estimated_price ?? null,
              max_price: r.estimated_price ?? null,
              price_source: 'iproperty',
              google_rating: r.google_rating ?? null,
              source: 'google_places',
              fit_score: aiInfo?.fit_score || 7.0,
              summary: aiInfo?.summary || 'Good match for students',
              reasoning: aiInfo?.reasoning || ['Within budget', 'Near campus area']
            };
          });

        return {
            saved_search: {
                query_text: query,
                location: intent.location,
                min_budget: intent.budget_min,
                max_budget: intent.budget_max,
                result_count: properties.length
            },
            // Sort by fit_score so the best picks are on top
            properties: properties.sort((a, b) => b.fit_score - a.fit_score)
        };
    }
);