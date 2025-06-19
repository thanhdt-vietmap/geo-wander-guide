# VietMap Geo Wander Guide

A modern, full-stack mapping application built with React, TypeScript, Node.js, and VietMap APIs.

## 🏗️ Architecture

This project uses a **multi-container Docker architecture**:
- **Client**: React app served by Nginx (port 3000)
- **Server**: Node.js API server (port 5005)
- **Production**: Nginx proxy handling routing

## 🚀 Quick Start

### Docker (Recommended)

```bash
# Development
npm run docker:deploy

# Production with proxy
npm run docker:deploy:prod

# Debug mode
npm run docker:deploy:debug

# Health check
npm run docker:health
```

### Local Development

```bash
# Install dependencies
npm install

# Start development servers
npm run dev

# Build for production
npm run build
```

## 📋 Available Scripts

### Docker Commands
| Command | Description |
|---------|-------------|
| `npm run docker:deploy` | Deploy development containers |
| `npm run docker:deploy:prod` | Deploy production with proxy |
| `npm run docker:deploy:debug` | Deploy debug mode |
| `npm run docker:health` | Check container health |
| `npm run docker:up` | Start containers |
| `npm run docker:down` | Stop containers |
| `npm run docker:logs` | View logs |

### Local Development
| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev servers |
| `npm run build` | Build both client & server |
| `npm run start` | Start production build |

## 🐳 Docker Configuration

The application now uses separate containers:

### Client Container
- **Base**: nginx:alpine
- **Features**: Obfuscated React build, gzip compression, security headers

### Server Container  
- **Base**: node:20.17.0-alpine
- **Features**: Production-optimized Node.js, non-root user

### Network Communication
- **Development**: `http://localhost:5005`
- **Production**: `http://server:5005` (internal Docker network)

## 📁 Project Structure

```
├── client/                 # React frontend
│   ├── Dockerfile         # Client container
│   ├── nginx.conf         # Nginx configuration
│   └── src/               # React source code
├── server/                # Node.js backend
│   ├── Dockerfile         # Server container
│   └── src/               # Server source code
├── docker-compose.yml     # Development setup
├── docker-compose.production.yml  # Production setup
├── nginx-proxy.conf       # Production proxy
└── docker-deploy.sh       # Deployment script
```

## 🔧 Configuration Files

- `docker-compose.yml` - Development containers
- `docker-compose.production.yml` - Production with Nginx proxy
- `docker-compose.debug.yml` - Debug mode with Node.js inspector
- `nginx-proxy.conf` - Production routing configuration

## 📖 Documentation

- [Docker Setup Guide](./DOCKER_SETUP.md) - Detailed Docker documentation
- [Implementation Status](./IMPLEMENTATION_STATUS.md) - Feature implementation status
- [Multi-language Support](./MULTI_LANGUAGE_IMPLEMENTATION.md) - i18n documentation
- [Rate Limiting](./RATE_LIMIT_API.md) - API rate limiting documentation

## 🌐 URLs

### Development
- **Client**: http://localhost:3000
- **Server**: http://localhost:5005

### Production (with proxy)
- **Application**: http://localhost (Nginx handles routing)

### Debug Mode
- **Client**: http://localhost:3000
- **Server**: http://localhost:5005
- **Debugger**: localhost:9229

## ⚙️ Environment Variables

The application automatically detects the environment:
- **Development**: Uses localhost URLs
- **Production**: Uses Docker internal network (`http://server:5005`)

## 🔍 Health Monitoring

Use the health check script to monitor container status:

```bash
npm run docker:health
```

This checks:
- Container status
- HTTP endpoints
- Recent logs for errors
- Resource usage

## 🛠️ Troubleshooting

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

## 📝 Development Notes

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/2d12d04c-92c8-4ba4-ab38-df6fc695516d) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)


### Deploy to VPS
If you want to deploy this project to your own VPS, you can follow these steps:
1. **Build the project**:
   ```sh
   npm run build
   ```
2. **Copy the `dist` folder to your VPS**:
   You can use `scp` or any other file transfer method to copy the `dist` folder to your VPS.
   ```sh
    scp -r ~/Documents/customer_success/geo-wander-guide/dist/* root@103.6.235.215:/var/www/maps.vietmap.us
   ```
3. **Reload nginx**:
    After copying the files, make sure to reload or restart your web server (e.g., Nginx or Apache) to serve the new files.
    ```sh
    sudo systemctl reload nginx
    ```

## Docker
`docker build --platform linux/amd64 -t vmlivemap .`

`docker save -o vmlivemap.tar vmlivemap:latest`

`scp vmlivemap.tar root@103.6.235.215:/root/`


## VPS

`docker stop vmlivemap-container`

`docker rm vmlivemap-container`

`docker image prune -a`

`docker load -i vmlivemap.tar`

`docker run -d --name vmlivemap-container --restart=always -p 5665:5005 vmlivemap:latest`


Reload nginx

```bash
sudo nginx -t
sudo systemctl reload nginx

```