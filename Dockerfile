# Multi-stage build
FROM node:v20.17.0 AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies
RUN npm ci

# Build client
FROM base AS client-builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/client/node_modules ./client/node_modules
COPY client ./client
RUN cd client && npm run build

# Build server
FROM base AS server-builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/server/node_modules ./server/node_modules
COPY server ./server
RUN cd server && npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy built server
COPY --from=server-builder --chown=nodejs:nodejs /app/server/dist ./server/dist
COPY --from=server-builder --chown=nodejs:nodejs /app/server/package*.json ./server/

# Copy built client
COPY --from=client-builder --chown=nodejs:nodejs /app/client/dist ./client/dist

# Install only production dependencies for server
WORKDIR /app/server
RUN npm ci --only=production && npm cache clean --force

USER nodejs

EXPOSE 5005

ENV PORT=5005

CMD ["npm", "start"]