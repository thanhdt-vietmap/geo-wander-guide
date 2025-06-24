# Nginx Configuration for maps.vietmap.us

## Cấu hình cho VPS với domain maps.vietmap.us

### Tạo file cấu hình Nginx:

```bash
sudo vim /etc/nginx/sites-available/maps.vietmap.us
```

### Nội dung file cấu hình:

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name maps.vietmap.us;
    return 301 https://$server_name$request_uri;
}

# HTTPS Configuration
server {
    listen 443 ssl http2;
    server_name maps.vietmap.us;

    # SSL Configuration (giả sử đã có SSL certificate)
    ssl_certificate /etc/ssl/certs/maps.vietmap.us.crt;
    ssl_certificate_key /etc/ssl/private/maps.vietmap.us.key;
    
    # Hoặc nếu dùng Let's Encrypt:
    # ssl_certificate /etc/letsencrypt/live/maps.vietmap.us/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/maps.vietmap.us/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline' 'unsafe-eval'" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Frontend Proxy (Port 5665)
    location / {
        proxy_pass http://localhost:5665;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        proxy_send_timeout 300s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }

    # API Proxy (Port 5005)
    location /api/ {
        proxy_pass http://localhost:5005/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        proxy_send_timeout 300s;
    }

    # Health Check Endpoint
    location /health {
        proxy_pass http://localhost:5005/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        access_log off;
    }

    # Static Assets Caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:5665;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Cache static assets
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Cache-Status "HIT";
    }

    # Deny access to sensitive files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    # Block access to backup and config files
    location ~* \.(bak|config|sql|fla|psd|ini|log|sh|inc|swp|dist)$ {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

### Enable cấu hình và restart Nginx:

```bash
# Enable site configuration
sudo ln -s /etc/nginx/sites-available/maps.vietmap.us /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Restart nginx (nếu cần)
sudo systemctl restart nginx
```

### Kiểm tra cấu hình:

```bash
# Test frontend
curl -k https://maps.vietmap.us

# Test API
curl -k https://maps.vietmap.us/api/health

# Test from browser
# https://maps.vietmap.us
```

### Nếu cần cập nhật DNS:

Đảm bảo domain `maps.vietmap.us` point về IP của VPS:

```bash
# Check DNS
nslookup maps.vietmap.us
dig maps.vietmap.us

# Test SSL certificate
openssl s_client -connect maps.vietmap.us:443 -servername maps.vietmap.us
```

### Log monitoring:

```bash
# Monitor access logs
sudo tail -f /var/log/nginx/access.log

# Monitor error logs
sudo tail -f /var/log/nginx/error.log

# Monitor application logs
docker-compose logs -f
```
