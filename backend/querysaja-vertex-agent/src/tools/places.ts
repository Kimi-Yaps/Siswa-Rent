import axios from 'axios';

export async function searchPlaces(intent: any) {
  const key = process.env.PLACES_API_KEY;
  const url = 'https://places.googleapis.com/v1/places:searchText';


  const queries = [
    `apartment near UTM Johor`,
    `room rental near Skudai Johor`,
    `student accommodation near UTM Johor Bahru`,
    `rumah sewa Skudai`,
  ];

  const headers = {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': key,
    'X-Goog-FieldMask':
      'places.id,places.displayName,places.formattedAddress,places.location,places.rating',
  };

  console.log(`\n[Places] Running ${queries.length} queries...`);

  const results = await Promise.allSettled(
    queries.map((textQuery) => {
      console.log(`[Places] Query: ${textQuery}`);
      return axios.post(
        url,
        {
          textQuery,
          maxResultCount: 10,
        },
        { headers }
      );
    })
  );

  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      const count = r.value.data?.places?.length || 0;
      console.log(`[Places] Success: "${queries[i]}" → ${count} places`);
    } else {
      console.error(`[Places] Failed: "${queries[i]}"`);
      console.error(r.reason?.response?.data || r.reason?.message || r.reason);
    }
  });

  const successfulResults = results
    .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
    .flatMap((r) => r.value.data?.places || []);

  const mapped = Array.from(
    new Map(successfulResults.map((p: any) => [p.id, p])).values()
  ).map((place: any) => ({
    place_id: place.id,
    id: place.id,
    name: place.displayName?.text || 'Unknown Property',
    address: place.formattedAddress || '',
    lat: place.location?.latitude,
    lng: place.location?.longitude,
    google_rating: place.rating || null,
  }));

  console.log(`[Places] Final mapped unique places: ${mapped.length}`);

  return mapped;
}