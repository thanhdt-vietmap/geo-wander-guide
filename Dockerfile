# DEPRECATED: This Dockerfile is now replaced by separate client/Dockerfile and server/Dockerfile
# This file is kept for backup purposes only
# Use docker-compose.yml which builds client and server separately

# Multi-stage build
FROM node:20.17.0-alpine AS base

# Build stage
FROM base AS builder
WORKDIR /app

# Copy all source files
COPY . .

# Install all dependencies
RUN npm install

# Install javascript-obfuscator globally in the build stage
RUN npm install -g javascript-obfuscator

# Build client with secure obfuscation and server
RUN cd client && npm run build:secure
RUN cd server && npm run build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Install serve globally for serving static files
RUN npm install -g serve concurrently

# Copy built files (using dist for obfuscated client build)
COPY --from=builder --chown=nodejs:nodejs /app/client/dist ./client/dist
COPY --from=builder --chown=nodejs:nodejs /app/server/dist ./server/dist
COPY --from=builder --chown=nodejs:nodejs /app/server/package*.json ./server/
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

# Install only production dependencies for server
WORKDIR /app/server
RUN npm install --production && npm cache clean --force

# Switch back to app directory
WORKDIR /app

USER nodejs

# Expose ports
EXPOSE 5005 3000

ENV PORT=5005

CMD ["npm", "run", "start:all"]