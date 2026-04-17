import express from 'express';
import { searchHousingFlow } from './flows/searchHousingFlow';

const app = express();
app.use(express.json());

app.post('/api/search', async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ error: "Missing 'query' parameter" });
        }
        
        const results = await searchHousingFlow(query);
        res.json(results);
    } catch (error: any) {
        console.error("[Error Endpoint]", error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3400;

app.listen(PORT, () => {
    console.log(`🏠 QuerySaja Vertex AI Agent active at http://localhost:${PORT}`);
});
