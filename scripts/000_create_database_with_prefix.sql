-- Database Creation Script with Project Prefix
-- This script creates the main database with configurable prefix
-- Prefix is read from environment variable DB_PREFIX or defaults to 'cts_v3_1'

-- Note: This must be run by a PostgreSQL superuser or user with CREATEDB privilege

-- Create database (prefix will be applied by setup script)
-- Database name format: {prefix}_main
CREATE DATABASE IF NOT EXISTS main_db
  WITH 
  ENCODING = 'UTF8'
  LC_COLLATE = 'en_US.UTF-8'
  LC_CTYPE = 'en_US.UTF-8'
  TEMPLATE = template0;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE main_db TO CURRENT_USER;

-- Connect to the new database and create extension
\c main_db

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create migrations tracking table
CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(255) PRIMARY KEY,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  applied_by VARCHAR(255) DEFAULT CURRENT_USER
);

-- Record this migration
INSERT INTO schema_migrations (version) VALUES ('000_create_database_with_prefix')
ON CONFLICT (version) DO NOTHING;
