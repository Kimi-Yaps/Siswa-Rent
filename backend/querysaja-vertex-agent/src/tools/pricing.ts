import fs from 'fs';
import path from 'path';

// Helper function to calculate distance between two coordinates (Haversine formula)
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    return R * c; 
}

export async function attachPricingAndFilter(places: any[], intent: any) {
    console.log(`\n[Pricing] Cross-referencing ${places.length} places with iProperty market data...`);
    
    // Load our scraped data
    const pricesPath = path.join(__dirname, '../data/prices.json');
    const marketData = JSON.parse(fs.readFileSync(pricesPath, 'utf-8'));

    const pricedPlaces = places.map(place => {
        // If the place doesn't have lat/lng yet (mock data), we assign a default Skudai coordinate
        const placeLat = place.lat || 1.5368;
        const placeLng = place.lng || 103.6558;

        // Find the closest locality in our market data
        let closestLocality = marketData[0];
        let shortestDistance = Infinity;

        marketData.forEach((locality: any) => {
            const dist = getDistanceFromLatLonInKm(placeLat, placeLng, locality.lat, locality.lng);
            if (dist < shortestDistance) {
                shortestDistance = dist;
                closestLocality = locality;
            }
        });

        // Attach the estimated price based on the closest locality's median
        return {
            ...place,
            estimated_price: closestLocality.median,
            price_range: `RM${closestLocality.min} - RM${closestLocality.max}`,
            market_zone: closestLocality.locality
        };
    });

    // Filter by student budget if they provided a max budget
    if (intent.budget_max) {
        const affordable = pricedPlaces.filter(p => p.estimated_price <= intent.budget_max);
        console.log(`[Pricing] Filtered out ${pricedPlaces.length - affordable.length} places exceeding RM${intent.budget_max} budget.`);
        return affordable;
    }

    return pricedPlaces;
}
