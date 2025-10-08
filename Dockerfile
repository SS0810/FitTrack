FROM node:20-alpine AS base

WORKDIR /app
RUN npm install -g pnpm

# Install dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile

# Build the app
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY . .
RUN pnpm run build

# Production image
FROM base AS runner
WORKDIR /app

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/data ./data

# ✅ FIX: Copy the entire scripts directory needed by the setup script
COPY --from=builder /app/scripts ./scripts

# ✅ FIX: Copy node_modules instead of reinstalling
COPY --from=builder /app/node_modules ./node_modules

# Copy and setup script with proper permissions
COPY scripts/setup.sh /app/setup.sh
RUN chmod +x /app/setup.sh && \
    sed -i 's/\r$//' /app/setup.sh

ENV PORT=3000
ENV NODE_ENV=production
ENV HOST=0.0.0.0

EXPOSE 3000

ENTRYPOINT ["/app/setup.sh"]
CMD ["pnpm", "start"]
