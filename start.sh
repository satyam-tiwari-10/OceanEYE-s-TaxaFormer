#!/bin/bash

echo "🚀 Starting Taxaformer..."
echo ""

# Check if .env exists
if [ ! -f backend/.env ]; then
    echo "⚠️  No .env file found. Creating from template..."
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env"
    echo "⚠️  Please edit backend/.env and add your Kaggle credentials!"
    echo ""
fi

# Start Docker services
echo "🐳 Starting Docker services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check backend health
echo ""
echo "🔍 Checking backend health..."
curl -s http://localhost:8000/health | python -m json.tool

echo ""
echo "✅ Backend is running at: http://localhost:8000"
echo "📊 Database is running at: localhost:5432"
echo ""
echo "📝 Next steps:"
echo "   1. Start frontend: npm run dev"
echo "   2. Open browser: http://localhost:3000"
echo "   3. Upload a FASTA file to test"
echo ""
echo "🔧 Useful commands:"
echo "   - View logs: docker-compose logs -f backend"
echo "   - Stop services: docker-compose down"
echo "   - Restart: docker-compose restart"
echo ""
