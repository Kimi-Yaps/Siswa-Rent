FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build && ls -la dist && test -f dist/index.html

EXPOSE 8080
CMD ["node", "server.js"]