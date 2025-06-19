# Client Dockerfile - Linux target
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
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY components.json ./
COPY eslint.config.js ./

# Install dependencies with platform-specific optimizations
RUN npm install

# Install javascript-obfuscator globally for secure build
RUN npm install -g javascript-obfuscator

# Copy source files
COPY public/ ./public/
COPY src/ ./src/
COPY index.html ./

# Build with secure obfuscation
RUN npm run build:secure

# Production stage
FROM nginx:alpine AS runner

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built files to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create nginx user and set permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    mkdir -p /tmp/nginx && \
    chown -R nginx:nginx /tmp/nginx

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Don't switch to non-root user to avoid permission issues
# USER nginx

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
