# Docker Setup Guide

This project now uses a multi-container Docker setup with separate containers for client and server.

## Architecture

- **Client Container**: Nginx serving React app (port 3000)
- **Server Container**: Node.js API server (port 5005)
- **Production**: Nginx proxy handling routing between client and server

## Quick Start

### Development
```bash
# Build and start both containers
npm run docker:up

# View logs
npm run docker:logs

# Stop containers
npm run docker:down
```

### Production with Nginx Proxy
```bash
# Start production setup with proxy
npm run docker:production
```

### Debug Mode
```bash
# Start with Node.js debugger enabled
npm run docker:debug
```

## Container Details

### Client Container
- **Base**: nginx:alpine
- **Port**: 80 (mapped to 3000)
- **Features**: 
  - Obfuscated React build
  - Gzip compression
  - Security headers
  - Static asset caching

### Server Container
- **Base**: node:20.17.0-alpine
- **Port**: 5005
- **Features**:
  - Production-optimized Node.js
  - Non-root user
  - Clean production dependencies

## Network Communication

In production, the client communicates with the server using Docker's internal network:
- Development: `http://localhost:5005`
- Production: `http://server:5005` (internal Docker network)

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run docker:build` | Build all containers |
| `npm run docker:up` | Start development containers |
| `npm run docker:down` | Stop all containers |
| `npm run docker:logs` | View container logs |
| `npm run docker:production` | Start production setup |
| `npm run docker:debug` | Start debug mode |

## File Structure

```
├── docker-compose.yml              # Development setup
├── docker-compose.production.yml   # Production with proxy
├── docker-compose.debug.yml        # Debug mode
├── nginx-proxy.conf                # Production proxy config
├── client/
│   ├── Dockerfile                  # Client container
│   ├── nginx.conf                  # Client Nginx config
│   └── .dockerignore
└── server/
    ├── Dockerfile                  # Server container
    └── .dockerignore
```

## Ports

| Service | Development | Production |
|---------|-------------|------------|
| Client | 3000 | 80 (via proxy) |
| Server | 5005 | 5005 (internal) |
| Proxy | - | 80, 443 |

## Environment Variables

Both containers automatically set `NODE_ENV=production` in Docker builds.

## Troubleshooting

### View container logs
```bash
docker-compose logs client
docker-compose logs server
```

### Access container shell
```bash
docker exec -it geo-wander-guide_client_1 sh
docker exec -it geo-wander-guide_server_1 sh
```

### Rebuild containers
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up
```
