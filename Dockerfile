# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

# Install build tools needed for native dependencies (canvas, sharp, puppeteer)
RUN apk add --no-cache \
    build-base \
    python3 \
    g++ \
    make \
    cairo-dev \
    pango-dev \
    giflib-dev \
    jpeg-dev \
    rust \
    && npm install -g pnpm

# Copy package files first for better caching
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies needed for build)
RUN npm ci

# Copy source code
COPY . .

# Build frontend (Vite) and backend (esbuild)
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

# Install runtime dependencies needed by native modules (canvas, sharp, puppeteer)
RUN apk add --no-cache \
    cairo \
    pango \
    giflib \
    libjpeg-turbo \
    ttf-dejavu-sans \
    chromium \
    nss \
    at-spi2-atk \
    && addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy built artifacts from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/migrations ./migrations

# Set ownership to non-root user
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
