-- Qmath Database Initialization
-- This script runs automatically when the PostgreSQL container starts for the first time

-- Enable UUID extension for generating unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create indexes for performance (these supplement the ones Drizzle creates)
-- Note: Drizzle migrations handle table creation, this is for additional optimization

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE qmath TO qmath;

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'Qmath database initialized successfully at %', NOW();
END $$;
