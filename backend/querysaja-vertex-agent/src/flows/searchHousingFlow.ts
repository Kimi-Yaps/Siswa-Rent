import { ai } from '../lib/genkit';
import { z } from 'zod';
import { parseIntent } from './parseIntent';
import { searchPlaces } from '../tools/places';
import { attachPricingAndFilter } from '../tools/pricing';
import { calculateDistance } from '../lib/geo';

// UTM Skudai Coordinates
const UTM_LAT = 1.559;
const UTM_LNG = 103.637;
const MAX_DISTANCE_KM = 15;

export const searchHousingFlow = ai.defineFlow(
    {
        name: 'searchHousingFlow',
        inputSchema: z.string(),
        outputSchema: z.any(),
    },
    async (query) => {
        const intent = await parseIntent(query);
        const rawPlaces = await searchPlaces(intent);
        
        const nearbyPlaces = rawPlaces.filter(p => {
            if (!p.lat || !p.lng) return false;
            const dist = calculateDistance(UTM_LAT, UTM_LNG, p.lat, p.lng);
            return dist <= MAX_DISTANCE_KM;
        });

        const results = await attachPricingAndFilter(nearbyPlaces, intent);

        const properties = results.map(r => ({
            place_id: r.place_id || r.id,
            name: r.name,
            address: r.address,
            neighborhood: r.market_zone,
            latitude: r.lat,
            longitude: r.lng,
            price_min: r.estimated_price ?? null,
            price_max: r.estimated_price ?? null,
            price_source: 'iproperty',
            google_rating: r.google_rating ?? null,
            source: 'google_places'
        }));

        return {
            saved_search: {
                query_text: query,
                location: intent.location,
                vibes: [],
                requirements: [],
                language_hint: 'ms-MY',
                min_budget: intent.budget_min,
                max_budget: intent.budget_max,
                result_count: properties.length
            },
            properties
        };
    }
);