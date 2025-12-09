# Taxaformer Architecture

## Overview

Clean, minimal architecture using:
- **Frontend**: Next.js (React + TypeScript)
- **Backend**: Python FastAPI
- **Database**: PostgreSQL (Dockerized)
- **Compute**: Kaggle API (for ML pipeline execution)

## Architecture Flow

```
User Upload (UploadPage.tsx)
    ↓
POST /analyse (FastAPI Backend)
    ↓
Compute SHA-256 Hash
    ↓
Check PostgreSQL Database
    ↓
┌─────────────────┬─────────────────┐
│  Hash Exists?   │  Hash Not Found │
│  Return Cached  │  Process New    │
└─────────────────┴─────────────────┘
                  ↓
          Send to Kaggle API
                  ↓
          Run ML Pipeline
                  ↓
        Download result.json
                  ↓
        Save to PostgreSQL
                  ↓
        Return JSON to Frontend
                  ↓
        Display Results
```

## Components

### 1. Frontend (UploadPage.tsx)
- File upload interface
- Sends FASTA files to `/analyse` endpoint
- Displays loading states
- Shows results or navigates to results page

### 2. Backend (main_new.py)
- **POST /analyse**: Main analysis endpoint
  - Reads file bytes
  - Computes SHA-256 hash
  - Checks database for existing results
  - If cached: returns immediately
  - If new: sends to Kaggle, saves result, returns
- **GET /health**: Health check with DB status

### 3. Database (PostgreSQL)
Schema:
```sql
analysis_jobs (
    id SERIAL PRIMARY KEY,
    job_id VARCHAR(64) UNIQUE,
    file_hash VARCHAR(64) UNIQUE,
    original_filename VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    status VARCHAR(50),
    result_json JSONB,
    error_message TEXT
)
```

### 4. Kaggle Worker (kaggle_worker.py)
- Handles Kaggle API communication
- Uploads FASTA files
- Triggers kernel execution
- Downloads result.json
- Currently in mock mode (returns test data)

## Setup Instructions

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for frontend)
- Kaggle API credentials

### 1. Clone and Setup

```bash
# Clone repository
git clone <your-repo>
cd <your-repo>

# Install frontend dependencies
npm install

# Setup backend environment
cd backend
cp .env.example .env
# Edit .env and add your Kaggle credentials
```

### 2. Configure Environment

Edit `backend/.env`:
```env
DB_HOST=postgres
DB_PORT=5432
DB_NAME=taxaformer_db
DB_USER=taxaformer_user
DB_PASSWORD=taxaformer_password
PORT=8000

# Get from https://www.kaggle.com/settings/account
KAGGLE_USERNAME=your_username
KAGGLE_KEY=your_api_key
```

### 3. Start Services

```bash
# Start backend + database with Docker
docker-compose up -d

# Check logs
docker-compose logs -f backend

# Start frontend (in separate terminal)
npm run dev
```

### 4. Verify Setup

```bash
# Check backend health
curl http://localhost:8000/health

# Should return:
# {
#   "status": "healthy",
#   "database": "connected",
#   "kaggle": "configured",
#   "timestamp": "..."
# }
```

### 5. Test Upload

1. Open http://localhost:3000
2. Navigate to Upload page
3. Upload a FASTA file
4. Backend will:
   - Hash the file
   - Check database
   - Process (or return cached result)
   - Return JSON

## Database Management

```bash
# Connect to database
docker exec -it taxaformer-db psql -U taxaformer_user -d taxaformer_db

# View all jobs
SELECT job_id, file_hash, original_filename, status, created_at FROM analysis_jobs;

# View specific result
SELECT result_json FROM analysis_jobs WHERE job_id = 'your-job-id';

# Clear all data (for testing)
TRUNCATE analysis_jobs;
```

## Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose up -d --build

# View logs
docker-compose logs -f backend
docker-compose logs -f postgres

# Reset everything (including database)
docker-compose down -v
docker-compose up -d
```

## API Endpoints

### POST /analyse
Upload and analyze FASTA file

**Request:**
```bash
curl -X POST http://localhost:8000/analyse \
  -F "file=@sample.fasta"
```

**Response (New Analysis):**
```json
{
  "status": "success",
  "cached": false,
  "job_id": "uuid-here",
  "data": {
    "metadata": {...},
    "taxonomy_summary": [...],
    "sequences": [...],
    "cluster_data": [...]
  }
}
```

**Response (Cached):**
```json
{
  "status": "success",
  "cached": true,
  "job_id": "uuid-here",
  "data": {...}
}
```

### GET /health
Health check

**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "kaggle": "configured",
  "timestamp": "2025-12-09T..."
}
```

## Kaggle Integration

### Setup Kaggle Kernel

1. Create a new Kaggle notebook
2. Add your ML pipeline code
3. Create `run_pipeline.py`:

```python
import sys
import json

def process_fasta(fasta_path):
    # Your ML pipeline here
    # Read FASTA, run model, generate results
    
    result = {
        "metadata": {...},
        "taxonomy_summary": [...],
        "sequences": [...],
        "cluster_data": [...]
    }
    
    # Save result
    with open('result.json', 'w') as f:
        json.dump(result, f)

if __name__ == "__main__":
    fasta_path = sys.argv[1]
    process_fasta(fasta_path)
```

4. Enable Internet in notebook settings
5. Note your kernel slug: `username/kernel-name`

### Update Backend

In `kaggle_worker.py`, implement:
- `upload_to_kaggle()`: Upload FASTA to Kaggle dataset
- `run_kaggle_kernel()`: Trigger kernel execution
- `download_results()`: Download result.json

## Development Workflow

### Local Development (No Kaggle)
```bash
# Backend returns mock data
docker-compose up -d
npm run dev
```

### With Kaggle Integration
1. Configure Kaggle credentials in `.env`
2. Implement Kaggle API calls in `kaggle_worker.py`
3. Test with real FASTA files

## Troubleshooting

### Database Connection Failed
```bash
# Check if postgres is running
docker-compose ps

# Check logs
docker-compose logs postgres

# Restart services
docker-compose restart
```

### Backend Not Starting
```bash
# Check logs
docker-compose logs backend

# Rebuild
docker-compose up -d --build backend
```

### Port Already in Use
```bash
# Change port in docker-compose.yml
ports:
  - "8001:8000"  # Use 8001 instead

# Update frontend API_URL
const API_URL = "http://localhost:8001";
```

## Production Deployment

### Option 1: Docker Compose (Simple)
```bash
# On server
docker-compose -f docker-compose.prod.yml up -d
```

### Option 2: Kubernetes (Scalable)
- Deploy backend as Deployment
- Deploy PostgreSQL as StatefulSet
- Use Ingress for routing
- Configure secrets for credentials

### Option 3: Cloud Services
- Backend: AWS ECS / Google Cloud Run
- Database: AWS RDS / Google Cloud SQL
- Frontend: Vercel / Netlify

## Security Notes

- Never commit `.env` files
- Use environment variables for secrets
- Enable HTTPS in production
- Implement rate limiting
- Add authentication if needed
- Validate file uploads (size, type)
- Sanitize database inputs (using parameterized queries)

## Performance Optimization

- Database indexing on `file_hash` (already implemented)
- Connection pooling for PostgreSQL
- Caching layer (Redis) for frequent queries
- Async processing for large files
- CDN for frontend assets

## Next Steps

1. ✅ Basic architecture setup
2. ✅ Database schema and caching
3. ✅ Frontend integration
4. 🔄 Implement real Kaggle API calls
5. 🔄 Add error handling and retries
6. 🔄 Implement job status tracking
7. 🔄 Add WebSocket for real-time updates
8. 🔄 Production deployment

## License

MIT
