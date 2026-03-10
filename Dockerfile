# --- Build Stage ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy prisma schema first
COPY prisma ./prisma

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy full source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Compile TypeScript
RUN npm run build

# Copy GraphQL schema files into dist
RUN cp -r src/graphql dist/graphql


# --- Migrator Stage ---
FROM node:20-alpine AS migrator

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

CMD ["npx", "prisma", "migrate", "deploy"]


# --- Production Stage ---
FROM node:20-alpine AS runner

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Generate Prisma client in production image
RUN npx prisma generate

EXPOSE 4000

CMD ["node", "dist/index.js"]