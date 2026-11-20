FROM node:22-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application source
COPY . .

# Build the React frontend into dist/
RUN npm run build

# Ensure persistent SQLite data directory exists
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/app/data/campus_events.db

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "server.ts"]
