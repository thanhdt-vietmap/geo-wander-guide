# Server Dockerfile - Linux target
FROM node:20.17.0-alpine AS base

# Set platform for multi-arch builds
ARG TARGETPLATFORM
ARG BUILDPLATFORM
RUN echo "Building on $BUILDPLATFORM, targeting $TARGETPLATFORM"

# Build stage
FROM base AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies with platform-specific optimizations
RUN npm install --production=false

# Copy source files
COPY src/ ./src/

# Build server
RUN npm run build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install curl for health checks
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

# Copy built files and package.json
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Install only production dependencies
RUN npm install --production --ignore-scripts && \
    npm cache clean --force

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:5005/health || curl -f http://localhost:5005 || exit 1

USER nodejs

# Expose port
EXPOSE 5005

ENV PORT=5005

CMD ["node", "dist/index.js"]
