# CTS v3.1 - Complete Database Setup Guide

## Overview

This guide covers the complete database setup for CTS v3.1, including user creation, database provisioning with project prefixes, and automated migration execution.

## Features

- **Dedicated Database Users**: Separate admin and application users for security
- **Project-Prefixed Databases**: All databases use `cts_v3_1_*` naming convention
- **Isolated Databases**: Separate databases for each indication and strategy type
- **Automated Migrations**: One-command setup with all migrations
- **Performance Optimized**: 50+ strategic indexes for high-performance queries
- **Integrity Checks**: Comprehensive validation and error detection

## Quick Start

### 1. Prerequisites

Install PostgreSQL client tools:

**Ubuntu/Debian:**
```bash
sudo apt-get install postgresql-client
```

**macOS:**
```bash
brew install postgresql
```

**Windows:**
Download from [postgresql.org](https://www.postgresql.org/download/)

### 2. Run Complete Setup

```bash
npm run db:setup:full
```

This single command will:
1. Create dedicated database users
2. Create all project-prefixed databases
3. Set up proper permissions
4. Run all migrations
5. Create performance indexes

### 3. Update Environment

Add to your `.env.local`:

```bash
# Application connection (runtime)
DATABASE_URL=postgresql://cts_v3_app:CTS_v3_AppPass_2025!@localhost:5432/cts_v3_1_main

# Admin connection (migrations)
REMOTE_POSTGRES_URL=postgresql://cts_v3_admin:CTS_v3_SecurePass_2025!@localhost:5432/cts_v3_1_main
```

## Database Structure

### Main Database
- **Name**: `cts_v3_1_main`
- **Purpose**: Core system data, users, connections, settings
- **Owner**: `cts_v3_admin`

### Indication Databases (Isolated)
- `cts_v3_1_indication_active` - Active indication type data
- `cts_v3_1_indication_direction` - Direction indication type data
- `cts_v3_1_indication_move` - Move indication type data

### Strategy Databases (Isolated)
- `cts_v3_1_strategy_simple` - Simple strategy data
- `cts_v3_1_strategy_advanced` - Advanced strategy data
- `cts_v3_1_strategy_step` - Step strategy data

## Database Users

### cts_v3_admin
- **Purpose**: Database administration and migrations
- **Permissions**: CREATEDB, CREATEROLE, full schema access
- **Usage**: Migration scripts, database maintenance

### cts_v3_app
- **Purpose**: Application runtime operations
- **Permissions**: SELECT, INSERT, UPDATE, DELETE on all tables
- **Usage**: Application database access

## Manual Setup (Advanced)

If you prefer manual setup or need custom configuration:

### Step 1: Create Users and Databases

```bash
psql -U postgres -f scripts/000_initial_database_setup.sql
```

### Step 2: Run Migrations

```bash
npm run db:migrate
```

### Step 3: Run Optimization

```bash
npm run db:optimize
```

### Step 4: Check Integrity

```bash
npm run db:integrity
```

## Performance Optimization

The system includes 50+ strategic indexes:

### Composite Indexes
- Multi-column indexes for complex queries
- Covering indexes for frequently accessed combinations
- Partial indexes for filtered queries

### Time-Series Optimization
- BRIN indexes for timestamp columns
- Optimized for time-based queries
- Automatic cleanup of old data

### Full-Text Search
- GIN indexes for text search
- Trigram indexes for pattern matching
- Optimized for symbol and name searches

## Security Best Practices

### Production Deployment

1. **Change Default Passwords**
   ```sql
   ALTER USER cts_v3_admin WITH PASSWORD 'your-secure-password';
   ALTER USER cts_v3_app WITH PASSWORD 'your-app-password';
   ```

2. **Use Environment Variables**
   Never hardcode credentials in configuration files

3. **Enable SSL**
   ```bash
   DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
   ```

4. **Restrict Network Access**
   Configure `pg_hba.conf` to allow only specific IPs

5. **Regular Backups**
   ```bash
   npm run db:backup
   ```

## Troubleshooting

### Connection Refused

**Problem**: Cannot connect to PostgreSQL
**Solution**:
- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Verify port is open: `netstat -an | grep 5432`
- Check firewall settings

### Permission Denied

**Problem**: User lacks necessary permissions
**Solution**:
- Verify user exists: `\du` in psql
- Re-run setup script with superuser
- Check `pg_hba.conf` authentication settings

### Migration Failed

**Problem**: Migration script errors
**Solution**:
- Check database connection
- Verify user permissions
- Review error logs
- Run integrity check: `npm run db:integrity`

## Monitoring and Maintenance

### Check Database Status

```bash
npm run db:status
```

### Run Integrity Checks

```bash
npm run db:integrity
```

### Optimize Performance

```bash
npm run db:optimize
```

### Backup Database

```bash
npm run db:backup
```

## Additional Resources

- PostgreSQL Documentation: https://www.postgresql.org/docs/
- Database Optimization Guide: `DATABASE_OPTIMIZATION_COMPLETE.md`
- Integrity Checker Documentation: See `lib/database-integrity-checker.ts`

## Support

For issues or questions:
- Check troubleshooting section above
- Review error logs in `logs/` directory
- Run system check: `npm run system:check`
