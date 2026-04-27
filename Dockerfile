# Stage 1: Build
FROM node:20-bookworm AS build

WORKDIR /app

# Install build tools needed for native dependencies (canvas npm)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy package files first for better caching
COPY package.json package-lock.json ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Build frontend and backend
RUN npm run build

# Stage 2: Production
FROM node:20-bookworm AS production

WORKDIR /app

# Install runtime dependencies (canvas npm)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libjpeg62-turbo \
    libgdk-pixbuf-2.0-0 \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd appgroup && useradd -g appgroup appuser

# Copy built artifacts from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/migrations ./migrations
COPY --from=build /app/server ./server
COPY --from=build /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=build /app/shared ./shared

# Set ownership for static files
RUN chown -R appuser:appgroup /app

# Copy entrypoint (runs as root for npx cache access)
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3000

ENV NODE_ENV=production

ENTRYPOINT ["/app/docker-entrypoint.sh"]
