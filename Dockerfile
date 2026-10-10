# Production image for Maryna Moroz Fitness (works on Render, Railway, Fly.io or any Docker host)
FROM node:22-slim

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# /data must be a persistent volume: it holds the database and uploaded photos/videos.
ENV NODE_ENV=production \
    PORT=3000 \
    DATABASE_URL=file:/data/app.db \
    STORAGE_DIR=/data/storage
RUN mkdir -p /data

EXPOSE 3000
# Creates/updates the database tables and the admin account on every start (content is only seeded once).
CMD ["sh", "-c", "npm run setup && npx next start -p ${PORT:-3000}"]
