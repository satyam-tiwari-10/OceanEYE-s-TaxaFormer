-- Database migration: Add analysis jobs with caching support
-- Run this once in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Main analysis jobs table with file hash for idempotency
CREATE TABLE IF NOT EXISTS analysis_jobs (
    job_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_hash text NOT NULL UNIQUE,
    filename text,
    uploader text,                -- optional: IP or user id
    status text NOT NULL,         -- 'processing','complete','failed'
    result jsonb,                 -- full analysis JSON
    created_at timestamptz DEFAULT now(),
    completed_at timestamptz,
    
    -- Indexes for performance
    CONSTRAINT valid_status CHECK (status IN ('processing', 'complete', 'failed'))
);

-- Sequences table for detailed analysis
CREATE TABLE IF NOT EXISTS sequences (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id uuid REFERENCES analysis_jobs(job_id) ON DELETE CASCADE,
    accession text,
    taxonomy text,
    length int,
    confidence numeric,
    overlap numeric,
    cluster text,
    novelty_score numeric,
    status text
);

-- Samples table for metadata
CREATE TABLE IF NOT EXISTS samples (
    sample_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id uuid REFERENCES analysis_jobs(job_id) ON DELETE CASCADE,
    sample_name text,
    total_sequences int,
    processing_time text,
    avg_confidence numeric
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_file_hash ON analysis_jobs(file_hash);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_status ON analysis_jobs(status);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_created_at ON analysis_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sequences_job_id ON sequences(job_id);
CREATE INDEX IF NOT EXISTS idx_sequences_taxonomy ON sequences(taxonomy);

-- Grant permissions (adjust as needed for your Supabase setup)
-- These are typically handled automatically by Supabase RLS policies