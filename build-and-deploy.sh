#!/bin/bash

# Script để build Docker image, export tar và copy lên VPS
# Dựa trên các lệnh trong README.md

set -e  # Dừng script nếu có lỗi

echo "🚀 Bắt đầu quá trình build và deploy..."

# 1. Build Docker image cho platform linux/amd64
echo "📦 Building Docker image..."
docker build --platform linux/amd64 -t vmlivemap .

# 2. Export Docker image thành tar file
echo "💾 Exporting Docker image to tar file..."
docker save -o vmlivemap.tar vmlivemap:latest

# 3. Copy tar file lên VPS
echo "🚚 Copying tar file to VPS..."
scp vmlivemap.tar root@103.6.235.215:/root/

# 4. Cleanup local tar file (optional)
echo "🧹 Cleaning up local tar file..."
rm vmlivemap.tar

echo "✅ Build và copy lên VPS hoàn thành!"
echo "🔧 Tiếp theo, chạy script deploy-on-vps.sh để reload container trên VPS"
