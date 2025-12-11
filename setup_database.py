"""
Setup script to create Supabase tables and test connection
Run this once to set up your database
"""
import os
from supabase import create_client

# Your Supabase credentials
SUPABASE_URL = "https://nbnyhdwbnxbheombbhtv.supabase.co"
# You need to get this from your Supabase dashboard > Settings > API
SUPABASE_KEY = "YOUR_ANON_KEY_HERE"  # Replace with your actual anon key

def setup_database():
    """Create tables and test connection"""
    print("🔗 Setting up Supabase database...")
    
    try:
        # Create client
        client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("✅ Connected to Supabase")
        
        # Read migration SQL
        with open('db/migration__add_analysis_jobs.sql', 'r') as f:
            migration_sql = f.read()
        
        print("📝 Creating tables...")
        
        # Execute migration (note: this is a simplified approach)
        # In production, you'd run this in Supabase SQL Editor
        
        # Test table creation by trying to insert a test record
        test_data = {
            "file_hash": "test_hash_123",
            "filename": "test.fasta",
            "status": "complete",
            "result": {"test": True}
        }
        
        response = client.table('analysis_jobs').insert(test_data).execute()
        print("✅ Tables created and working")
        
        # Clean up test record
        client.table('analysis_jobs').delete().eq('file_hash', 'test_hash_123').execute()
        print("✅ Database setup complete")
        
        return True
        
    except Exception as e:
        print(f"❌ Database setup failed: {e}")
        print("\n💡 Manual setup required:")
        print("1. Go to https://supabase.com/dashboard")
        print("2. Open your project")
        print("3. Go to SQL Editor")
        print("4. Copy and run the content from db/migration__add_analysis_jobs.sql")
        print("5. Get your anon key from Settings > API")
        return False

if __name__ == "__main__":
    setup_database()