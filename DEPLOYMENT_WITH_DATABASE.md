# Database-Backed Deployment Guide

## Overview
This guide covers deploying Taxaformer with database caching for persistent storage and idempotent analysis results.

## Architecture
```
Frontend (Next.js) → Backend (FastAPI + Kaggle) → Supabase Database
                                ↓
                         Analysis Pipeline
```

## Quick Start

### 1. Database Setup (5 minutes, one-time)
```bash
# 1. Create Supabase project at https://supabase.com/dashboard
# 2. Open SQL Editor in Supabase
# 3. Copy and run: db/migration__add_analysis_jobs.sql
# 4. Note your SUPABASE_URL and SUPABASE_KEY
```

### 2. Backend Deployment (Kaggle)
```python
# In Kaggle notebook with internet enabled:
!pip install fastapi uvicorn pyngrok python-multipart supabase

# Set in Kaggle Secrets:
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_KEY=your-anon-key
# USE_DATABASE=true

# Run cached backend:
exec(open('backend/main_cached.py').read())
```

### 3. Frontend (No Changes Required)
```bash
# Existing frontend works as-is
npm run dev
# or deploy to Vercel normally
```

## Features Added

### Caching & Idempotency
- **File Hash**: SHA-256 of file content (not filename)
- **Cache Hit**: Identical files return stored results instantly
- **Cache Miss**: New files are processed and stored
- **Job Tracking**: Every analysis gets unique job_id

### API Response Changes
```json
{
  "status": "success",
  "job_id": "uuid-here",        // NEW: Unique job identifier
  "cached": false,              // NEW: Cache status
  "data": {
    // Existing data structure unchanged
  }
}
```

### New Endpoints
```bash
GET /jobs                     # List all analysis jobs
GET /jobs/{job_id}           # Get specific job
GET /visualizations/composition/{job_id}?rank=phylum
```

## Testing

### Manual Test Sequence
```bash
# 1. Upload file via frontend → Should get job_id
# 2. Upload SAME file again → Should get cached=true, same job_id
# 3. Upload DIFFERENT file → Should get new job_id
# 4. Check Supabase tables for records
```

### Unit Tests
```bash
cd backend
python test_caching.py
```

## Rollback Plan

### Instant Rollback (Feature Flag)
```python
# In Kaggle environment variables:
USE_DATABASE=false

# Restart backend - works without database
```

### Code Rollback
```python
# Use original backend instead:
exec(open('backend/main.py').read())  # No database
```

### Database Rollback
```sql
-- In Supabase SQL Editor (if needed):
DROP TABLE IF EXISTS sequences CASCADE;
DROP TABLE IF EXISTS samples CASCADE;  
DROP TABLE IF EXISTS analysis_jobs CASCADE;
```

## Environment Variables

### Kaggle Secrets (Required)
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key-here
USE_DATABASE=true
```

### Optional Settings
```bash
NGROK_TOKEN=your-ngrok-token  # For tunneling
```

## Monitoring

### Health Check
```bash
GET /health
# Returns database connection status
```

### Database Monitoring
- Supabase Dashboard → Tables → analysis_jobs
- Monitor cache hit rates and storage growth
- Check query performance logs

## Troubleshooting

### Database Connection Issues
```python
# Test connection:
from db.supabase_db import TaxaformerDB
db = TaxaformerDB()  # Should not raise error
```

### Common Errors
1. **"Database not available"** → Check SUPABASE_URL/KEY
2. **"Table does not exist"** → Run migration SQL
3. **Cache not working** → Verify USE_DATABASE=true

### Fallback Mode
If database fails, backend automatically continues without caching:
```
⚠️ Database not available: [error]
⚠️ Backend will work without database (no data persistence)
```

## Security

### Supabase Security
- Store credentials in Kaggle Secrets (never in code)
- Use Row Level Security (RLS) for production
- Regular backups via Supabase dashboard

### API Security
- File upload validation (FASTA/FASTQ only)
- Rate limiting recommended for production
- HTTPS via ngrok tunneling

## Performance

### Caching Benefits
- **Instant Results**: Cached responses < 100ms
- **Resource Savings**: No reprocessing of identical files
- **Scalability**: Database handles concurrent requests

### Optimization Tips
- Monitor cache hit rates in Supabase
- Consider file size limits for large uploads
- Use database indexes (already included in migration)

## Migration Path

### From No Database → With Database
1. Deploy new backend alongside existing
2. Test with sample files
3. Switch frontend API_URL when ready
4. Old analyses continue working (localStorage)

### Gradual Rollout
```python
# Use feature flag for gradual rollout:
ENABLE_CACHING_PERCENT=50  # Cache 50% of requests
```

## Support

### Files Created
- `db/migration__add_analysis_jobs.sql` - Database schema
- `db/supabase_db.py` - Database operations
- `backend/main_cached.py` - Backend with caching
- `backend/test_caching.py` - Test suite

### Documentation Updated
- `BACKEND_API_FORMAT.md` - Added job_id field
- This deployment guide

### No Changes Required
- Frontend code (works with existing localStorage)
- UI/UX (no visual changes)
- Existing API contracts (backward compatible)

---

**Ready to deploy? Follow the Quick Start section above! 🚀**