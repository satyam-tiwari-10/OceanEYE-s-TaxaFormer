#!/bin/bash
# Development Docker Start Script for Taxaformer

echo "========================================"
echo "Starting Taxaformer (Development Mode)"
echo "========================================"
echo ""

echo "Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed or not running!"
    echo "Please install Docker and start it."
    exit 1
fi

echo ""
echo "Building and starting services with hot reload..."
docker-compose -f docker-compose.dev.yml up -d --build

if [ $? -ne 0 ]; then
    echo ""
    echo "ERROR: Failed to start services!"
    echo "Check the logs above for details."
    exit 1
fi

echo ""
echo "========================================"
echo "Services started successfully!"
echo "========================================"
echo ""
echo "Frontend: http://localhost:3000 (Hot Reload Enabled)"
echo "Backend:  http://localhost:8000 (Hot Reload Enabled)"
echo "Database: localhost:5432"
echo ""
echo "To view logs: docker-compose -f docker-compose.dev.yml logs -f"
echo "To stop:      docker-compose -f docker-compose.dev.yml down"
echo ""
