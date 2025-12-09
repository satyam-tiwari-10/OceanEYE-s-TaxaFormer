"""
Taxaformer Backend - Clean Architecture
Local backend + Docker + Kaggle compute worker
"""
import os
import hashlib
import json
import uuid
import tempfile
from datetime import datetime
from typing import Optional

import uvicorn
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from psycopg2.extras import RealDictCursor

from kaggle_worker import KaggleWorker

# Initialize FastAPI
app = FastAPI(title="Taxaformer API", version="2.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection
def get_db_connection():
    """Create database connection"""
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=os.getenv("DB_PORT", "5432"),
        database=os.getenv("DB_NAME", "taxaformer_db"),
        user=os.getenv("DB_USER", "taxaformer_user"),
        password=os.getenv("DB_PASSWORD", "taxaformer_password")
    )

# Initialize Kaggle worker with ngrok URL
kaggle_worker = KaggleWorker(
    ngrok_url=os.getenv("KAGGLE_NGROK_URL")
)


def compute_file_hash(file_bytes: bytes) -> str:
    """Compute SHA-256 hash of file content"""
    return hashlib.sha256(file_bytes).hexdigest()


def check_existing_result(file_hash: str) -> Optional[dict]:
    """Check if analysis already exists in database"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute(
            "SELECT job_id, result_json, created_at FROM analysis_jobs WHERE file_hash = %s AND status = 'completed'",
            (file_hash,)
        )
        result = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if result:
            return {
                "job_id": result["job_id"],
                "result": result["result_json"],
                "cached": True,
                "cached_at": result["created_at"].isoformat()
            }
        return None
    except Exception as e:
        print(f"Database check error: {e}")
        return None


def save_result_to_db(job_id: str, file_hash: str, filename: str, result_json: dict):
    """Save analysis result to database"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            """
            INSERT INTO analysis_jobs (job_id, file_hash, original_filename, status, result_json)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (file_hash) 
            DO UPDATE SET 
                result_json = EXCLUDED.result_json,
                status = EXCLUDED.status,
                updated_at = CURRENT_TIMESTAMP
            """,
            (job_id, file_hash, filename, "completed", json.dumps(result_json))
        )
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"✅ Saved result to database: {job_id}")
    except Exception as e:
        print(f"❌ Database save error: {e}")


@app.get("/")
async def root():
    """Health check"""
    return {
        "status": "online",
        "service": "Taxaformer API v2",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.post("/analyse")
async def analyse_endpoint(file: UploadFile = File(...)):
    """
    Main analysis endpoint
    
    Flow:
    1. Read file and compute SHA-256 hash
    2. Check database for existing result
    3. If exists, return cached result
    4. If not, send to Kaggle for processing
    5. Download result from Kaggle
    6. Save to database
    7. Return result
    """
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")
        
        # Check file extension
        allowed_extensions = ['.fasta', '.fa', '.fna', '.fastq', '.fq']
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type. Allowed: {', '.join(allowed_extensions)}"
            )
        
        # Read file content
        file_content = await file.read()
        file_size = len(file_content)
        
        print(f"📁 Received file: {file.filename} ({file_size} bytes)")
        
        # Compute hash
        file_hash = compute_file_hash(file_content)
        print(f"🔐 File hash: {file_hash}")
        
        # Check for existing result
        existing = check_existing_result(file_hash)
        if existing:
            print(f"✅ Found cached result from {existing['cached_at']}")
            return {
                "status": "success",
                "cached": True,
                "job_id": existing["job_id"],
                "data": existing["result"]
            }
        
        # Generate new job ID
        job_id = str(uuid.uuid4())
        print(f"🆕 New job: {job_id}")
        
        # Save file temporarily for Kaggle upload
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp_file:
            tmp_file.write(file_content)
            tmp_filepath = tmp_file.name
        
        try:
            # Send to Kaggle for processing
            print(f"🚀 Sending to Kaggle...")
            result_json = kaggle_worker.process_file(tmp_filepath, file.filename)
            
            # Save result to database
            save_result_to_db(job_id, file_hash, file.filename, result_json)
            
            print(f"✅ Analysis complete: {job_id}")
            
            return {
                "status": "success",
                "cached": False,
                "job_id": job_id,
                "data": result_json
            }
            
        finally:
            # Clean up temp file
            if os.path.exists(tmp_filepath):
                os.remove(tmp_filepath)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check():
    """Detailed health check"""
    db_status = "unknown"
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.close()
        conn.close()
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    kaggle_status = "not configured"
    if kaggle_worker.is_configured():
        kaggle_status = "online" if kaggle_worker.check_server_health() else "offline"
    
    return {
        "status": "healthy",
        "database": db_status,
        "kaggle": kaggle_status,
        "kaggle_url": os.getenv("KAGGLE_NGROK_URL", "not set"),
        "timestamp": datetime.utcnow().isoformat()
    }


if __name__ == "__main__":
    PORT = int(os.getenv("PORT", 8000))
    print(f"\n🚀 Starting Taxaformer Backend on port {PORT}")
    print(f"📊 Database: {os.getenv('DB_HOST', 'localhost')}:{os.getenv('DB_PORT', '5432')}")
    
    kaggle_url = os.getenv('KAGGLE_NGROK_URL', '')
    if kaggle_url:
        print(f"🔧 Kaggle Server: {kaggle_url}")
        if kaggle_worker.check_server_health():
            print(f"✅ Kaggle server is online")
        else:
            print(f"⚠️  Kaggle server is offline or unreachable")
    else:
        print(f"⚠️  Kaggle ngrok URL not configured (will use mock data)")
    
    print()
    uvicorn.run(app, host="0.0.0.0", port=PORT)
