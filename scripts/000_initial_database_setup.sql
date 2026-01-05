-- CTS v3.1 - Initial Database Setup Script
-- This script creates the dedicated database user, databases, and grants permissions
-- Run this with superuser privileges (postgres user)

-- =============================================================================
-- 1. CREATE DEDICATED DATABASE USER
-- =============================================================================

-- Drop user if exists (for clean reinstall)
DROP USER IF EXISTS cts_v3_admin;
DROP USER IF EXISTS cts_v3_app;

-- Create admin user (for migrations and maintenance)
CREATE USER cts_v3_admin WITH
  PASSWORD 'CTS_v3_SecurePass_2025!'
  CREATEDB
  CREATEROLE
  LOGIN;

-- Create application user (for runtime operations)
CREATE USER cts_v3_app WITH
  PASSWORD 'CTS_v3_AppPass_2025!'
  LOGIN;

COMMENT ON ROLE cts_v3_admin IS 'CTS v3.1 administrative user for database management';
COMMENT ON ROLE cts_v3_app IS 'CTS v3.1 application user for runtime operations';

-- =============================================================================
-- 2. CREATE MAIN DATABASE WITH PROJECT PREFIX
-- =============================================================================

-- Drop databases if they exist (for clean reinstall)
DROP DATABASE IF EXISTS cts_v3_1_main;
DROP DATABASE IF EXISTS cts_v3_1_indication_active;
DROP DATABASE IF EXISTS cts_v3_1_indication_direction;
DROP DATABASE IF EXISTS cts_v3_1_indication_move;
DROP DATABASE IF EXISTS cts_v3_1_strategy_simple;
DROP DATABASE IF EXISTS cts_v3_1_strategy_advanced;
DROP DATABASE IF EXISTS cts_v3_1_strategy_step;

-- Create main database
CREATE DATABASE cts_v3_1_main
  WITH
  OWNER = cts_v3_admin
  ENCODING = 'UTF8'
  LC_COLLATE = 'en_US.UTF-8'
  LC_CTYPE = 'en_US.UTF-8'
  TEMPLATE = template0
  CONNECTION LIMIT = -1;

COMMENT ON DATABASE cts_v3_1_main IS 'CTS v3.1 main database for core system data';

-- Create indication-specific databases for better isolation
CREATE DATABASE cts_v3_1_indication_active
  WITH
  OWNER = cts_v3_admin
  ENCODING = 'UTF8'
  LC_COLLATE = 'en_US.UTF-8'
  LC_CTYPE = 'en_US.UTF-8'
  TEMPLATE = template0
  CONNECTION LIMIT = -1;

CREATE DATABASE cts_v3_1_indication_direction
  WITH
  OWNER = cts_v3_admin
  ENCODING = 'UTF8'
  LC_COLLATE = 'en_US.UTF-8'
  LC_CTYPE = 'en_US.UTF-8'
  TEMPLATE = template0
  CONNECTION LIMIT = -1;

CREATE DATABASE cts_v3_1_indication_move
  WITH
  OWNER = cts_v3_admin
  ENCODING = 'UTF8'
  LC_COLLATE = 'en_US.UTF-8'
  LC_CTYPE = 'en_US.UTF-8'
  TEMPLATE = template0
  CONNECTION LIMIT = -1;

-- Create strategy-specific databases for better isolation
CREATE DATABASE cts_v3_1_strategy_simple
  WITH
  OWNER = cts_v3_admin
  ENCODING = 'UTF8'
  LC_COLLATE = 'en_US.UTF-8'
  LC_CTYPE = 'en_US.UTF-8'
  TEMPLATE = template0
  CONNECTION LIMIT = -1;

CREATE DATABASE cts_v3_1_strategy_advanced
  WITH
  OWNER = cts_v3_admin
  ENCODING = 'UTF8'
  LC_COLLATE = 'en_US.UTF-8'
  LC_CTYPE = 'en_US.UTF-8'
  TEMPLATE = template0
  CONNECTION LIMIT = -1;

CREATE DATABASE cts_v3_1_strategy_step
  WITH
  OWNER = cts_v3_admin
  ENCODING = 'UTF8'
  LC_COLLATE = 'en_US.UTF-8'
  LC_CTYPE = 'en_US.UTF-8'
  TEMPLATE = template0
  CONNECTION LIMIT = -1;

COMMENT ON DATABASE cts_v3_1_indication_active IS 'CTS v3.1 active indication type isolated database';
COMMENT ON DATABASE cts_v3_1_indication_direction IS 'CTS v3.1 direction indication type isolated database';
COMMENT ON DATABASE cts_v3_1_indication_move IS 'CTS v3.1 move indication type isolated database';
COMMENT ON DATABASE cts_v3_1_strategy_simple IS 'CTS v3.1 simple strategy type isolated database';
COMMENT ON DATABASE cts_v3_1_strategy_advanced IS 'CTS v3.1 advanced strategy type isolated database';
COMMENT ON DATABASE cts_v3_1_strategy_step IS 'CTS v3.1 step strategy type isolated database';

-- =============================================================================
-- 3. GRANT PERMISSIONS TO APPLICATION USER
-- =============================================================================

-- Grant connection privileges to main database
GRANT CONNECT ON DATABASE cts_v3_1_main TO cts_v3_app;
GRANT CONNECT ON DATABASE cts_v3_1_indication_active TO cts_v3_app;
GRANT CONNECT ON DATABASE cts_v3_1_indication_direction TO cts_v3_app;
GRANT CONNECT ON DATABASE cts_v3_1_indication_move TO cts_v3_app;
GRANT CONNECT ON DATABASE cts_v3_1_strategy_simple TO cts_v3_app;
GRANT CONNECT ON DATABASE cts_v3_1_strategy_advanced TO cts_v3_app;
GRANT CONNECT ON DATABASE cts_v3_1_strategy_step TO cts_v3_app;

-- Switch to main database for schema grants
\c cts_v3_1_main;

-- Grant schema privileges
GRANT USAGE ON SCHEMA public TO cts_v3_app;
GRANT CREATE ON SCHEMA public TO cts_v3_admin;

-- Grant table privileges (will apply to all future tables via default privileges)
ALTER DEFAULT PRIVILEGES FOR ROLE cts_v3_admin IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO cts_v3_app;

ALTER DEFAULT PRIVILEGES FOR ROLE cts_v3_admin IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO cts_v3_app;

ALTER DEFAULT PRIVILEGES FOR ROLE cts_v3_admin IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO cts_v3_app;

-- Repeat for all indication databases
\c cts_v3_1_indication_active;
GRANT USAGE ON SCHEMA public TO cts_v3_app;
ALTER DEFAULT PRIVILEGES FOR ROLE cts_v3_admin IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO cts_v3_app;
ALTER DEFAULT PRIVILEGES FOR ROLE cts_v3_admin IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO cts_v3_app;

\c cts_v3_1_indication_direction;
GRANT USAGE ON SCHEMA public TO cts_v3_app;
ALTER DEFAULT PRIVILEGES FOR ROLE cts_v3_admin IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO cts_v3_app;
ALTER DEFAULT PRIVILEGES FOR ROLE cts_v3_admin IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO cts_v3_app;

\c cts_v3_1_indication_move;
GRANT USAGE ON SCHEMA public TO cts_v3_app;
ALTER DEFAULT PRIVILEGES FOR ROLE cts_v3_admin IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO cts_v3_app;
ALTER DEFAULT PRIVILEGES FOR ROLE cts_v3_admin IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO cts_v3_app;

-- Repeat for all strategy databases
\c cts_v3_1_strategy_simple;
GRANT USAGE ON SCHEMA public TO cts_v3_app;
ALTER DEFAULT PRIVILEGES FOR ROLE cts_v3_admin IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO cts_v3_app;
ALTER DEFAULT PRIVILEGES FOR ROLE cts_v3_admin IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO cts_v3_app;

\c cts_v3_1_strategy_advanced;
GRANT USAGE ON SCHEMA public TO cts_v3_app;
ALTER DEFAULT PRIVILEGES FOR ROLE cts_v3_admin IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO cts_v3_app;
ALTER DEFAULT PRIVILEGES FOR ROLE cts_v3_admin IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO cts_v3_app;

\c cts_v3_1_strategy_step;
GRANT USAGE ON SCHEMA public TO cts_v3_app;
ALTER DEFAULT PRIVILEGES FOR ROLE cts_v3_admin IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO cts_v3_app;
ALTER DEFAULT PRIVILEGES FOR ROLE cts_v3_admin IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO cts_v3_app;

-- =============================================================================
-- 4. CREATE EXTENSIONS
-- =============================================================================

\c cts_v3_1_main;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For text search optimization
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- For composite indexes
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"; -- For query performance monitoring

-- =============================================================================
-- SETUP COMPLETE
-- =============================================================================

\c postgres;

-- Display summary
SELECT 
  'Setup Complete!' as status,
  'cts_v3_admin' as admin_user,
  'cts_v3_app' as app_user,
  '7 databases created' as databases_info;

-- List all created databases
SELECT datname, pg_encoding_to_char(encoding) as encoding, datcollate, datctype
FROM pg_database
WHERE datname LIKE 'cts_v3_1_%'
ORDER BY datname;
