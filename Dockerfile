# --- Build Stage ---
FROM node:20-alpine AS builder

WORKDIR /app

COPY prisma ./prisma
# Copy package files and install ALL deps (including devDeps for tsc)
COPY package*.json ./
RUN npm ci

# Copy source and Prisma schema
COPY . .

# Generate Prisma client BEFORE compiling TypeScript (tsc needs the types)
RUN npx prisma generate

# Compile TypeScript
RUN npm run build

# --- Migrator Stage (keeps devDeps so tsx can run prisma.config.ts) ---
FROM node:20-alpine AS migrator

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
# COPY --from=builder /app/src/generated ./src/generated

CMD ["npx", "prisma", "migrate", "deploy"]

# --- Production Stage ---
FROM node:20-alpine AS runner

WORKDIR /app

# Only install production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled output, Prisma schema, config and generated client
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/src/generated ./src/generated

# Generate Prisma client in production image
RUN npx prisma generate

EXPOSE 4000

# Default command (can be overridden in docker-compose for the worker)
CMD ["node", "dist/index.js"]
