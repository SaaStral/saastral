FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY packages/core/package.json ./packages/core/
COPY packages/infrastructure/package.json ./packages/infrastructure/
COPY packages/shared/package.json ./packages/shared/
COPY apps/worker/package.json ./apps/worker/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps/worker ./apps/worker

# Copy source files
COPY packages ./packages
COPY apps/worker ./apps/worker
COPY turbo.json ./
COPY tsconfig.base.json ./

# Build packages
RUN pnpm --filter @saastral/core build
RUN pnpm --filter @saastral/infrastructure build
RUN pnpm --filter @saastral/shared build
RUN pnpm --filter worker build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 worker

# Copy built files
COPY --from=builder --chown=worker:nodejs /app/apps/worker/dist ./dist
COPY --from=builder --chown=worker:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=worker:nodejs /app/packages ./packages

USER worker

EXPOSE 3001

CMD ["node", "dist/index.js"]
