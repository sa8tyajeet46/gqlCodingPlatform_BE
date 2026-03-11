# --- Dependency Stage (shared base) ---
FROM node:20-alpine AS deps

WORKDIR /app
COPY package*.json ./
# Install ALL deps once (cached layer)
RUN npm ci

# --- Build Stage ---
FROM node:20-alpine AS builder

WORKDIR /app

# Reuse node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client + compile in one layer
RUN npx prisma generate && \
    npm run build && \
    cp -r src/graphql dist/graphql

# --- Migrator Stage ---
FROM node:20-alpine AS migrator

WORKDIR /app

# Only copy what migrate needs - no full npm ci
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

CMD ["npx", "prisma", "migrate", "deploy"]

# --- Production Stage ---
FROM node:20-alpine AS runner

WORKDIR /app

# Prune to production deps only (don't re-run npm ci)
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
RUN npm prune --omit=dev

# Copy compiled app + prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Reuse already-generated prisma client from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 4000

CMD ["node", "dist/index.js"]
