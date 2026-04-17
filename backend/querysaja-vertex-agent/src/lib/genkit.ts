import { genkit } from 'genkit';
import { vertexAI } from '@genkit-ai/google-genai';
import dotenv from 'dotenv';
dotenv.config();

export const ai = genkit({
    plugins: [
        vertexAI({
            projectId: process.env.GCP_PROJECT_ID,
            location: process.env.GCP_LOCATION || 'us-central1',
        })
    ],
});

export const defaultModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
