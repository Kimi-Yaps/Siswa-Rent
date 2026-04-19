import express from 'express';
import { searchHousingFlow } from './flows/searchHousingFlow';
import { supabase } from './lib/supabase.ts';

const app = express();
app.use(express.json());

console.log('[Boot] index.ts loaded');
console.log('[Boot] SUPABASE_URL set:', !!process.env.SUPABASE_URL);
console.log('[Boot] SUPABASE_SERVICE_ROLE_KEY set:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

app.post('/api/search', async (req, res) => {
  try {
    const { query, user_id } = req.body;

    console.log('[Route] /api/search hit');
    console.log('[Route] query:', query);
    console.log('[Route] user_id:', user_id);

    if (!query) {
      return res.status(400).json({ error: "Missing 'query' parameter" });
    }

    const result = await searchHousingFlow(query);
    const { saved_search, properties } = result;

    console.log('[Route] saved_search:', saved_search);
    console.log('[Route] properties count:', properties?.length || 0);

    if (properties && properties.length > 0) {
      const { data: propData, error: propError } = await supabase
        .from('properties')
        .upsert(properties, { onConflict: 'place_id' })
        .select();

      if (propError) {
        console.error('[Supabase properties upsert error]', propError);
      } else {
        console.log('[Supabase] Upserted properties rows:', propData?.length ?? 0);
      }
    } else {
      console.log('[Supabase] No properties to upsert');
    }

    if (user_id && saved_search) {
      const payload = {
        user_id,
        query_text: saved_search.query_text,
        location: saved_search.location,
        vibes: saved_search.vibes || [],
        requirements: saved_search.requirements || [],
        min_budget: saved_search.min_budget,
        max_budget: saved_search.max_budget,
        language_hint: saved_search.language_hint || 'ms-MY',
        result_count: saved_search.result_count,
      };

      console.log('[Supabase] saved_search payload:', payload);

      const { data: searchData, error: searchError } = await supabase
        .from('saved_searches')
        .insert(payload)
        .select();

      if (searchError) {
        console.error('[Supabase saved_searches insert error]', searchError);
      } else {
        console.log('[Supabase] Inserted saved_search row:', searchData);
      }
    } else {
      console.log('[Supabase] saved_search insert skipped (missing user_id or saved_search)');
    }

    res.json(result);
  } catch (error: any) {
    console.error('[Error Endpoint]', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3400;

app.listen(PORT, () => {
  console.log(`🏠 QuerySaja Vertex AI Agent active at http://localhost:${PORT}`);
});