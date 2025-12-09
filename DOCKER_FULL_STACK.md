# 🐳 Full Stack Docker Setup

Run the entire Taxaformer application (Frontend + Backend + Database) in Docker.

## 🚀 Quick Start

### Option 1: Production Mode (Optimized Build)

```bash
docker-compose up -d
```

Or use the script:
```bash
docker-start-all.bat
```

**Access:**
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Database: localhost:5432

### Option 2: Development Mode (Hot Reload)

```bash
docker-compose -f docker-compose.dev.yml up -d
```

Or use the script:
```bash
docker-start-dev.bat
```

**Features:**
- ✅ Code changes auto-reload
- ✅ Faster startup (no build)
- ✅ Volume-mounted source code

## 📦 What's Included

```
┌─────────────────────┐
│   Frontend          │
│   Next.js           │
│   Port: 3000        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Backend           │
│   FastAPI           │
│   Port: 8000        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   PostgreSQL        │
│   Database          │
│   Port: 5432        │
└─────────────────────┘
           │
           ▼
┌─────────────────────┐
│   Kaggle Server     │
│   (via ngrok)       │
└─────────────────────┘
```

## 🔧 Configuration

### Update Kaggle URL

When your Kaggle ngrok URL changes:

**Option 1: Edit docker-compose.yml**
```yaml
backend:
  environment:
    KAGGLE_NGROK_URL: https://your-new-url.ngrok-free.dev
```

**Option 2: Use update script**
```bash
update-kaggle-url.bat
```

Then restart:
```bash
docker-compose restart backend
```

### Environment Variables

**Backend (.env):**
```env
DB_HOST=postgres
DB_PORT=5432
DB_NAME=taxaformer_db
DB_USER=taxaformer_user
DB_PASSWORD=taxaformer_password
KAGGLE_NGROK_URL=https://your-url.ngrok-free.dev
KAGGLE_TIMEOUT=300
PORT=8000
```

**Frontend (docker-compose.yml):**
```yaml
frontend:
  environment:
    NEXT_PUBLIC_API_URL: http://backend:8000
```

## 🛠️ Common Commands

### Start Services

```bash
# Production mode
docker-compose up -d

# Development mode
docker-compose -f docker-compose.dev.yml up -d

# With logs
docker-compose up
```

### Stop Services

```bash
# Stop
docker-compose stop

# Stop and remove
docker-compose down

# Stop and remove volumes (deletes database!)
docker-compose down -v
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f postgres
```

### Rebuild

```bash
# Rebuild all
docker-compose build

# Rebuild specific service
docker-compose build frontend
docker-compose build backend

# Rebuild and start
docker-compose up --build
```

### Access Containers

```bash
# Frontend shell
docker-compose exec frontend sh

# Backend shell
docker-compose exec backend bash

# Database
docker-compose exec postgres psql -U taxaformer_user -d taxaformer_db
```

## 🧪 Testing

### 1. Check All Services

```bash
docker-compose ps
```

Expected output:
```
NAME                    STATUS
taxaformer-db           Up (healthy)
taxaformer-backend      Up
taxaformer-frontend     Up
```

### 2. Test Backend

```bash
curl http://localhost:8000/health
```

Expected:
```json
{
  "status": "healthy",
  "database": "connected",
  "kaggle": "online"
}
```

### 3. Test Frontend

Open browser: http://localhost:3000

Should see the Taxaformer homepage.

### 4. Test Upload

1. Navigate to Upload page
2. Upload `sample.fasta`
3. Click "Analyze"
4. Should see results

### 5. Check Logs

```bash
docker-compose logs -f
```

Should see:
- Frontend: Next.js server running
- Backend: FastAPI receiving requests
- Database: PostgreSQL ready

## 🔄 Development Workflow

### Production Mode

**Best for:**
- Testing production build
- Performance testing
- Deployment preview

**Workflow:**
1. Make code changes
2. Rebuild: `docker-compose build`
3. Restart: `docker-compose up -d`

### Development Mode

**Best for:**
- Active development
- Quick iterations
- Debugging

**Workflow:**
1. Start: `docker-compose -f docker-compose.dev.yml up -d`
2. Make code changes
3. Changes auto-reload (no rebuild needed!)

## 📊 Resource Usage

**Typical usage:**
- Frontend: ~150-200 MB RAM
- Backend: ~100-150 MB RAM
- PostgreSQL: ~50-100 MB RAM
- Total: ~300-450 MB RAM

**Disk space:**
- Images: ~1-2 GB
- Database: ~100 MB (grows with data)

## 🐛 Troubleshooting

### Frontend won't start

```bash
# Check logs
docker-compose logs frontend

# Common issues:
# - Build failed → Run: docker-compose build frontend
# - Port 3000 in use → Change port in docker-compose.yml
# - Node modules issue → Rebuild: docker-compose build --no-cache frontend
```

### Backend connection failed

```bash
# Check backend is running
docker-compose ps backend

# Check logs
docker-compose logs backend

# Restart backend
docker-compose restart backend
```

### Database connection failed

```bash
# Check database health
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

### Port conflicts

If ports 3000, 8000, or 5432 are in use:

**Edit docker-compose.yml:**
```yaml
frontend:
  ports:
    - "3001:3000"  # Change 3001 to any free port

backend:
  ports:
    - "8001:8000"  # Change 8001 to any free port

postgres:
  ports:
    - "5433:5432"  # Change 5433 to any free port
```

### Build is slow

```bash
# Use BuildKit for faster builds
set DOCKER_BUILDKIT=1
docker-compose build
```

### Out of disk space

```bash
# Clean up unused images
docker system prune -a

# Remove old volumes
docker volume prune
```

## 🔒 Security Notes

### Development
- Default credentials are fine
- All services on localhost
- CORS allows all origins

### Production
1. **Change database password** in docker-compose.yml
2. **Restrict CORS** in backend/main_new.py
3. **Use secrets** for sensitive data
4. **Enable HTTPS** with reverse proxy
5. **Add authentication** to API

## 🚀 Deployment

### Build for Production

```bash
# Build optimized images
docker-compose build

# Tag images
docker tag taxaformer-frontend:latest your-registry/taxaformer-frontend:v1
docker tag taxaformer-backend:latest your-registry/taxaformer-backend:v1

# Push to registry
docker push your-registry/taxaformer-frontend:v1
docker push your-registry/taxaformer-backend:v1
```

### Deploy to Server

```bash
# On server
docker-compose pull
docker-compose up -d
```

## 📝 File Structure

```
taxaformer/
├── Dockerfile                    # Frontend Dockerfile
├── .dockerignore                 # Docker ignore rules
├── docker-compose.yml            # Production setup
├── docker-compose.dev.yml        # Development setup
├── next.config.ts                # Next.js config (standalone mode)
├── backend/
│   ├── Dockerfile                # Backend Dockerfile
│   ├── main_new.py               # FastAPI app
│   ├── kaggle_worker.py          # Kaggle integration
│   └── init.sql                  # Database schema
└── src/
    └── components/
        └── UploadPage.tsx        # Uses NEXT_PUBLIC_API_URL
```

## ✅ Advantages of Full Docker Setup

1. **Consistency** - Same environment everywhere
2. **Isolation** - No conflicts with local setup
3. **Easy Setup** - One command to start everything
4. **Portability** - Works on any machine with Docker
5. **Scalability** - Easy to add more services
6. **Production-Ready** - Same setup for dev and prod

## 🎯 Quick Reference

```bash
# Start everything
docker-compose up -d

# Stop everything
docker-compose down

# View logs
docker-compose logs -f

# Rebuild
docker-compose build

# Update Kaggle URL
update-kaggle-url.bat

# Reset everything
docker-compose down -v
docker-compose up --build
```

## 🆘 Support

**Services not starting?**
1. Check Docker Desktop is running
2. Run: `docker-compose ps`
3. Check logs: `docker-compose logs`

**Frontend can't reach backend?**
1. Check backend health: `curl http://localhost:8000/health`
2. Verify NEXT_PUBLIC_API_URL in docker-compose.yml
3. Check network: `docker network ls`

**Database issues?**
1. Check health: `docker-compose exec postgres pg_isready`
2. View logs: `docker-compose logs postgres`
3. Restart: `docker-compose restart postgres`

---

**Ready to go!** Start with `docker-compose up -d` and open http://localhost:3000
