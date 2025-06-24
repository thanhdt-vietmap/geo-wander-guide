# VPS Deployment Guide - Geo Wander Guide

Hướng dẫn step-by-step để deploy ứng dụng Geo Wander Guide lên VPS sử dụng Docker và Docker Compose.

## Yêu cầu hệ thống

### VPS Requirements
- **RAM**: Tối thiểu 2GB (khuyến nghị 4GB)
- **Storage**: Tối thiểu 20GB SSD
- **CPU**: 2 cores trở lên
- **OS**: Ubuntu 20.04 LTS hoặc Ubuntu 22.04 LTS
- **Network**: Public IP và domain name (optional)

### Port Requirements
- **Port 80**: HTTP traffic (Nginx reverse proxy)
- **Port 443**: HTTPS traffic (SSL/TLS)
- **Port 22**: SSH access
- **Port 3000**: Frontend application (internal)
- **Port 5005**: Backend API (internal)

## Bước 1: Chuẩn bị VPS

### 1.1 Kết nối VPS via SSH
```bash
ssh root@YOUR_VPS_IP
# hoặc
ssh username@YOUR_VPS_IP
```

### 1.2 Update hệ thống
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git vim ufw
```

### 1.3 Cấu hình Firewall
```bash
# Enable firewall
sudo ufw enable

# Allow SSH
sudo ufw allow 22

# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Check status
sudo ufw status
```

### 1.4 Tạo user deploy (khuyến nghị)
```bash
# Tạo user mới
sudo adduser deploy
sudo usermod -aG sudo deploy
sudo usermod -aG docker deploy

# Chuyển sang user deploy
su - deploy
```

## Bước 2: Cài đặt Docker và Docker Compose

### 2.1 Cài đặt Docker
```bash
# Remove old Docker packages
sudo apt remove docker docker-engine docker.io containerd runc

# Install prerequisites
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add current user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker compose version
```

### 2.2 Test Docker installation
```bash
docker run hello-world
```

## Bước 3: Cài đặt Nginx (Reverse Proxy)

### 3.1 Cài đặt Nginx
```bash
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

### 3.2 Cấu hình Nginx
```bash
# Remove default config
sudo rm /etc/nginx/sites-enabled/default

# Create new config
sudo vim /etc/nginx/sites-available/geo-wander-guide
```

**Nội dung file `/etc/nginx/sites-available/geo-wander-guide`:**
```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Frontend proxy
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:5005/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # VMLiveMap API proxy
    location /vmlivemap/ {
        proxy_pass http://localhost:5665/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:5005/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3.3 Enable Nginx config
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/geo-wander-guide /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## Bước 4: Deploy Application

### 4.1 Clone repository
```bash
# Chọn thư mục để deploy
cd /home/deploy
# hoặc
cd /opt

# Clone repository
git clone https://github.com/YOUR_USERNAME/geo-wander-guide.git
cd geo-wander-guide
```

### 4.2 Cấu hình Environment Variables
```bash
# Tạo file .env cho production
cp .env.development .env.production

# Edit production environment
vim .env.production
```

**Nội dung file `.env.production`:**
```env
NODE_ENV=production
PORT=5005

# Database configurations (nếu có)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=geo_wander_guide
DB_USER=your_db_user
DB_PASS=your_db_password

# API Keys
VIETMAP_API_KEY=your_vietmap_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Security
JWT_SECRET=your_jwt_secret_key
ENCRYPTION_KEY=your_encryption_key

# CORS settings
ALLOWED_ORIGINS=http://YOUR_DOMAIN,https://YOUR_DOMAIN

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4.3 Update Docker Compose cho production
```bash
# Backup original docker-compose.yml
cp docker-compose.yml docker-compose.yml.backup

# Edit docker-compose.yml for production
vim docker-compose.yml
```

**Cập nhật docker-compose.yml:**
```yaml
services:
  client:
    build: 
      context: ./client
      dockerfile: Dockerfile
    container_name: geo-frontend
    ports:
      - "3000:80"
    networks:
      - app-network
    environment:
      - NODE_ENV=production
      - VITE_API_URL=http://localhost:5005
    depends_on:
      - server
    restart: unless-stopped

  server:
    build: 
      context: ./server
      dockerfile: Dockerfile
    container_name: geo-backend
    ports:
      - "5005:5005"
    networks:
      - app-network
    environment:
      - NODE_ENV=production
      - PORT=5005
    env_file:
      - .env.production
    restart: unless-stopped

networks:
  app-network:
    driver: bridge
```

### 4.4 Build và chạy containers
```bash
# Build containers
docker compose build --no-cache

# Start containers
docker compose up -d

# Check status
docker compose ps

# Check logs
docker compose logs -f
```

## Bước 5: Cấu hình SSL (HTTPS)

### 5.1 Cài đặt Certbot
```bash
sudo apt install -y snapd
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

### 5.2 Lấy SSL certificate
```bash
# Stop nginx temporarily
sudo systemctl stop nginx

# Get certificate
sudo certbot certonly --standalone -d YOUR_DOMAIN

# Start nginx
sudo systemctl start nginx
```

### 5.3 Cập nhật Nginx config cho HTTPS
```bash
sudo vim /etc/nginx/sites-available/geo-wander-guide
```

**Thêm HTTPS configuration:**
```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name YOUR_DOMAIN;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name YOUR_DOMAIN;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/YOUR_DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/YOUR_DOMAIN/privkey.pem;
    
    # SSL security settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    # ... rest of the configuration same as HTTP version
}
```

### 5.4 Auto-renewal SSL certificate
```bash
# Test renewal
sudo certbot renew --dry-run

# Add cron job for auto-renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

## Bước 6: Monitoring và Maintenance

### 6.1 Tạo health check script
```bash
vim /home/deploy/health-check.sh
```

**Nội dung health-check.sh:**
```bash
#!/bin/bash

# Health check script
echo "Checking application health..."

# Check containers
docker compose ps

# Check application endpoints
curl -f http://localhost:5005/health || echo "Backend health check failed"
curl -f http://localhost:3000 || echo "Frontend health check failed"

# Check logs for errors
docker compose logs --tail=50 | grep -i error
```

### 6.2 Tạo backup script
```bash
vim /home/deploy/backup.sh
```

**Nội dung backup.sh:**
```bash
#!/bin/bash

# Backup script
BACKUP_DIR="/home/deploy/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup environment files
cp .env.production $BACKUP_DIR/env_$DATE.backup

# Backup database (nếu có)
# docker compose exec -T database pg_dump -U username dbname > $BACKUP_DIR/db_$DATE.sql

# Clean old backups (keep last 7 days)
find $BACKUP_DIR -name "*.backup" -mtime +7 -delete
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete

echo "Backup completed: $DATE"
```

### 6.3 Monitoring với systemd
```bash
# Tạo systemd service
sudo vim /etc/systemd/system/geo-wander-guide.service
```

**Nội dung service file:**
```ini
[Unit]
Description=Geo Wander Guide Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/deploy/geo-wander-guide
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

```bash
# Enable service
sudo systemctl enable geo-wander-guide.service
sudo systemctl start geo-wander-guide.service
```

## Bước 7: Deployment Commands

### 7.1 Update và redeploy
```bash
# Update code
git pull origin main

# Rebuild and restart
docker compose build --no-cache
docker compose down
docker compose up -d

# Check status
docker compose ps
docker compose logs -f
```

### 7.2 Useful commands
```bash
# View logs
docker compose logs -f [service_name]

# Restart services
docker compose restart

# Stop all services
docker compose down

# Remove all containers and volumes
docker compose down -v --remove-orphans

# Check resource usage
docker stats

# Clean up unused images
docker image prune -a
```

## Bước 8: Troubleshooting

### 8.1 Common issues
1. **Port already in use**: Kiểm tra các service đang chạy trên port 3000 và 5005
2. **Memory issues**: Tăng RAM hoặc thêm swap
3. **SSL certificate issues**: Kiểm tra domain pointing và firewall
4. **Docker build failures**: Kiểm tra network và disk space

### 8.2 Debug commands
```bash
# Check system resources
free -h
df -h
htop

# Check network
netstat -tulpn | grep :80
netstat -tulpn | grep :443

# Check Docker
docker system df
docker system prune

# Check Nginx
sudo nginx -t
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log
```

## Bước 9: Security Best Practices

1. **Firewall**: Chỉ mở các port cần thiết
2. **SSH**: Sử dụng SSH key thay vì password
3. **Updates**: Thường xuyên update OS và packages
4. **Backup**: Tự động backup database và config files
5. **Monitoring**: Setup monitoring và alerting
6. **Logs**: Thường xuyên kiểm tra logs để phát hiện issues

---

## Quick Start Script

Tạo script để tự động hóa quá trình deployment:

```bash
vim deploy.sh
```

**Nội dung deploy.sh:**
```bash
#!/bin/bash

echo "Starting deployment..."

# Update code
git pull origin main

# Build and deploy
docker compose build --no-cache
docker compose down
docker compose up -d

# Wait for services to start
sleep 30

# Health check
curl -f http://localhost:5005/health && echo "✅ Backend is healthy"
curl -f http://localhost:3000 && echo "✅ Frontend is healthy"

echo "Deployment completed!"
```

```bash
chmod +x deploy.sh
./deploy.sh
```

Chúc bạn deploy thành công! 🚀
