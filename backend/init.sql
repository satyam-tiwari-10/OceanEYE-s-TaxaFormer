-- Initialize Taxaformer Database Schema

CREATE TABLE IF NOT EXISTS analysis_jobs (
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

-- Index for fast hash lookups
CREATE INDEX IF NOT EXISTS idx_file_hash ON analysis_jobs(file_hash);
CREATE INDEX IF NOT EXISTS idx_job_id ON analysis_jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_created_at ON analysis_jobs(created_at DESC);

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_analysis_jobs_updated_at 
    BEFORE UPDATE ON analysis_jobs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
