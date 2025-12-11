# Quick Setup Instructions

## For Kaggle Notebook (Recommended)

### Step 1: Run Setup Script
```python
# In your Kaggle notebook, run this once:
exec(open('kaggle_setup.py').read())
```

### Step 2: Start Backend with Caching
```python
# After setup is complete, run:
exec(open('backend/main_cached.py').read())
```

### Step 3: Test Caching
1. Upload a file via your frontend
2. Note the processing time
3. Upload the SAME file again
4. Should return instantly with `cached: true`

## For Local Testing

### Step 1: Install Supabase
```bash
pip install supabase
```

### Step 2: Test Connection
```python
python test_db_simple.py
```

### Step 3: Run Backend
```python
python backend/main_cached.py
```

## Verification

### Check Database
- Go to your Supabase dashboard
- Click "Table Editor"
- You should see records in `analysis_jobs` table after uploading files

### Check Caching
- Upload file → Should take normal processing time
- Upload same file → Should return in <1 second with `cached: true`

### Check Logs
Backend will show:
```
✅ Supabase database connected
💾 Cache HIT: Returning cached result for job [job_id]
```

## Troubleshooting

### "No module named 'supabase'"
```python
!pip install supabase  # In Kaggle
# or
pip install supabase   # Locally
```

### "Database not available"
- Check your Supabase URL and key are correct
- Verify tables were created (run the SQL migration)
- Backend will still work without database (no caching)

### Caching not working
- Verify `USE_DATABASE=true` in environment
- Check backend logs for database connection messages
- Make sure you're uploading the exact same file (same content)

## Expected Behavior

### First Upload (Cache Miss)
```json
{
  "status": "success",
  "job_id": "uuid-here",
  "cached": false,
  "data": { ... }
}
```

### Second Upload (Cache Hit)
```json
{
  "status": "success", 
  "job_id": "same-uuid",
  "cached": true,
  "data": { ... }
}
```

## Files You Need

- `backend/main_cached.py` - Backend with caching
- `db/supabase_db.py` - Database wrapper
- `kaggle_setup.py` - Setup script

## Ready to Go!

Once setup is complete, your backend will automatically:
- ✅ Store all analysis results in Supabase
- ✅ Return cached results for identical files
- ✅ Work without database if connection fails
- ✅ Provide job_id for all analyses