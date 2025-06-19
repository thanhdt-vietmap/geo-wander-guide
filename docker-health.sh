#!/bin/bash

# Health check script for Docker containers
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if containers are running
check_containers() {
    print_status "Checking container status..."
    
    # Get list of running containers
    RUNNING_CONTAINERS=$(docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}")
    
    if [[ -z "$RUNNING_CONTAINERS" ]] || [[ "$RUNNING_CONTAINERS" == *"NAMES"* ]]; then
        print_error "No containers are currently running"
        return 1
    fi
    
    echo "$RUNNING_CONTAINERS"
    print_success "Containers are running"
}

# Health check client
check_client() {
    print_status "Checking client health..."
    
    # Try to reach client
    if curl -f -s http://localhost:3000 > /dev/null 2>&1; then
        print_success "Client is healthy (http://localhost:3000)"
    else
        print_error "Client is not responding"
        return 1
    fi
}

# Health check server
check_server() {
    print_status "Checking server health..."
    
    # Try to reach server (assuming it has a health endpoint)
    if curl -f -s http://localhost:5005/health > /dev/null 2>&1; then
        print_success "Server is healthy (http://localhost:5005)"
    elif curl -f -s http://localhost:5005 > /dev/null 2>&1; then
        print_warning "Server is responding but no health endpoint found"
    else
        print_error "Server is not responding"
        return 1
    fi
}

# Check logs for errors
check_logs() {
    print_status "Checking recent logs for errors..."
    
    # Check for error patterns in logs
    ERROR_PATTERNS=("ERROR" "Error" "error" "FATAL" "Fatal" "Exception" "exception")
    
    for pattern in "${ERROR_PATTERNS[@]}"; do
        if docker-compose logs --tail=50 2>/dev/null | grep -i "$pattern" >/dev/null 2>&1; then
            print_warning "Found '$pattern' in recent logs"
            echo "Recent errors:"
            docker-compose logs --tail=10 | grep -i "$pattern" | tail -3
        fi
    done
    
    print_success "Log check completed"
}

# Check resource usage
check_resources() {
    print_status "Checking container resource usage..."
    
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
    
    print_success "Resource check completed"
}

# Main health check
main() {
    echo "🏥 Docker Container Health Check"
    echo "================================"
    
    if ! command -v curl &> /dev/null; then
        print_warning "curl is not installed. Some health checks will be skipped."
    fi
    
    check_containers || exit 1
    echo ""
    
    if command -v curl &> /dev/null; then
        check_client
        check_server
        echo ""
    fi
    
    check_logs
    echo ""
    
    check_resources
    echo ""
    
    print_success "🎉 Health check completed!"
}

# Run main function
main "$@"
