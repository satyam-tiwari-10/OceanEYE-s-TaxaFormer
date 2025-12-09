# Taxaformer Backend v2

FastAPI backend with PostgreSQL database and Kaggle integration.

## Architecture

```
Frontend → Backend API → PostgreSQL Database
                ↓
         Kaggle Worker → Kaggle API → ML Pipeline
```

## Features

- ✅ FastAPI REST API
- ✅ SHA-256 file hashing for deduplication
- ✅ PostgreSQL database with caching
- ✅ Kaggle API integration (mock mode)
- ✅ Docker support
- ✅ CORS enabled

## Quick Start

### With Docker (Recommended)

```bash
# 1. Configure environment
cp .env.example .env
# Edit .env and add Kaggle credentials

# 2. Start services
docker-compose up -d

# 3. Check health
curl http://localhost:8000/health
```

### Local Development

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Start PostgreSQL (or use Docker)
docker-compose up -d postgres

# 3. Configure environment
cp .env.example .env
# Edit .env

# 4. Run backend
python main_new.py
```

## API Endpoints

### POST /analyse
Analyze FASTA file with caching

**Request:**
```bash
curl -X POST http://localhost:8000/analyse \
  -F "file=@sample.fasta"
```

**Response (New):**
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
Health check with database status

**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "kaggle": "configured",
  "timestamp": "2025-12-09T..."
}
```

## Database Schema

```sql
CREATE TABLE analysis_jobs (
    id SERIAL PRIMARY KEY,
    job_id VARCHAR(64) UNIQUE NOT NULL,
    file_hash VARCHAR(64) UNIQUE NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending',
    result_json JSONB,
    error_message TEXT
);
```

## Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=taxaformer_db
DB_USER=taxaformer_user
DB_PASSWORD=taxaformer_password

# Server
PORT=8000

# Kaggle API
KAGGLE_USERNAME=your_username
KAGGLE_KEY=your_api_key
```

## Kaggle Integration

### Setup

1. Get Kaggle credentials from https://www.kaggle.com/settings/account
2. Add to `.env` file
3. Create Kaggle notebook with `kaggle_notebook_template.py`
4. Implement `kaggle_worker.py` methods:
   - `upload_to_kaggle()`
   - `run_kaggle_kernel()`
   - `download_results()`

### Current Status

Currently in **mock mode** - returns test data.

To enable real Kaggle integration:
1. Implement methods in `kaggle_worker.py`
2. Use Kaggle API to upload files
3. Trigger kernel execution
4. Download `result.json`

## Files

- `main_new.py` - Main FastAPI application
- `kaggle_worker.py` - Kaggle API integration
- `init.sql` - Database schema
- `Dockerfile` - Docker container config
- `requirements.txt` - Python dependencies
- `kaggle_notebook_template.py` - Template for Kaggle notebook

## Database Management

```bash
# Connect to database
docker exec -it taxaformer-db psql -U taxaformer_user -d taxaformer_db

# View all jobs
SELECT job_id, file_hash, original_filename, status, created_at 
FROM analysis_jobs;

# View specific result
SELECT result_json FROM analysis_jobs WHERE job_id = 'your-job-id';

# Clear all data
TRUNCATE analysis_jobs;
```

## Testing

```bash
# Test with curl
curl -X POST http://localhost:8000/analyse \
  -F "file=@test.fasta"

# Test caching (upload same file twice)
curl -X POST http://localhost:8000/analyse \
  -F "file=@test.fasta"
# Second request should return instantly with "cached": true

# Check health
curl http://localhost:8000/health
```

## Docker Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Rebuild after changes
docker-compose up -d --build backend

# Stop services
docker-compose down

# Reset everything
docker-compose down -v
docker-compose up -d
```

## Troubleshooting

### Database connection failed
```bash
# Check if postgres is running
docker-compose ps

# Restart postgres
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

### Port already in use
```bash
# Change port in docker-compose.yml
ports:
  - "8001:8000"
```

### Kaggle not configured
```bash
# Check .env file
cat .env | grep KAGGLE

# Verify credentials
curl http://localhost:8000/health
```

## Development

```bash
# Make changes to code
# Rebuild and restart
docker-compose up -d --build backend

# View logs
docker-compose logs -f backend

# Test changes
curl http://localhost:8000/health
```

## Production Deployment

See [ARCHITECTURE.md](../ARCHITECTURE.md) for deployment options:
- Docker Compose
- Kubernetes
- Cloud services (AWS, GCP, Azure)

## Dependencies

Main dependencies:
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `psycopg2-binary` - PostgreSQL driver
- `kaggle` - Kaggle API client
- `python-multipart` - File upload support

See `requirements.txt` for complete list.
