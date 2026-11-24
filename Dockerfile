 
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/app/data/campus_events.db

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

CMD ["npx", "tsx", "server.ts"]
