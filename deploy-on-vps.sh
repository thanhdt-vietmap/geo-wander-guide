#!/bin/bash

# Script để SSH vào VPS và reload Docker container mới
# Dựa trên các lệnh trong README.md

set -e  # Dừng script nếu có lỗi

VPS_HOST="root@103.6.235.215"

echo "🔄 Kết nối VPS và reload Docker container..."

# SSH vào VPS và chạy các lệnh reload
ssh $VPS_HOST << 'EOF'
echo "🛑 Stopping existing container..."
docker stop vmlivemap-container || true

echo "🗑️ Removing existing container..."
docker rm vmlivemap-container || true

echo "🧹 Cleaning up Docker images..."
docker image prune -a -f

echo "📥 Loading new Docker image from tar..."
docker load -i vmlivemap.tar

echo "🚀 Starting new container..."
docker run -d --name vmlivemap-container --restart=always -p 5665:5005 vmlivemap:latest

echo "🔧 Testing nginx configuration..."
sudo nginx -t

echo "🔄 Reloading nginx..."
sudo systemctl reload nginx

echo "✅ Deploy hoàn thành! Container đã được khởi động lại với image mới."

# Kiểm tra trạng thái container
echo "📊 Trạng thái container:"
docker ps | grep vmlivemap-container || echo "❌ Container không chạy"
EOF

echo "🎉 Deploy trên VPS hoàn thành!"
