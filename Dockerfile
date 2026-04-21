# Write the Dockerfile content directly
@'
FROM node:22-alpine

WORKDIR /app

ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_GOOGLE_JAVASCRIPT_MAP_API
ARG VITE_GEMINI_API_KEY

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_GOOGLE_JAVASCRIPT_MAP_API=$VITE_GOOGLE_JAVASCRIPT_MAP_API
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 8080
CMD ["node", "server.js"]
'@ | Set-Content Dockerfile

# Verify it has content
cat Dockerfile

# Commit and push
git add Dockerfile
git commit -m "fix: add Dockerfile content"
git push origin main