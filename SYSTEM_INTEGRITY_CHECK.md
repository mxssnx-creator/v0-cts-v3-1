# System Integrity Checker

Comprehensive validation system for CTS v3.1 that checks all critical components.

## Features

### 1. Database Connectivity
- Verifies database connection
- Tests query execution
- Validates database type (PostgreSQL/SQLite)

### 2. Database Schema Integrity
- Checks all required tables exist
- Validates table accessibility
- Verifies data structure

### 3. Exchange Connections
- Validates API credentials
- Checks connector initialization
- Verifies exchange support

### 4. Trade Engine Health
- Monitors engine status
- Checks individual engines
- Tracks pause state

### 5. High-Performance Router
- Validates separated tables
- Checks indication tables (active, direction, move)
- Verifies strategy tables (simple, advanced, step)

### 6. File Storage
- Checks settings file accessibility
- Validates security configuration
- Verifies critical settings

### 7. Configuration
- Validates environment variables
- Checks required settings
- Verifies system configuration

## API Usage

### Full Integrity Check
GET /api/system/integrity-check

Returns comprehensive report with all checks.

### Quick Health Check
GET /api/system/integrity-check?quick=true

Returns lightweight health status.

## Response Format

{
  "success": true,
  "report": {
    "overallStatus": "healthy" | "warnings" | "critical",
    "totalChecks": 45,
    "passed": 43,
    "warnings": 2,
    "errors": 0,
    "checks": [...],
    "timestamp": "2025-01-06T..."
  }
}

## Programmatic Usage

import { getSystemIntegrityChecker } from "@/lib/system-integrity-checker"

const checker = getSystemIntegrityChecker()
const report = await checker.runFullCheck()

## Automated Monitoring

The integrity checker can be scheduled to run automatically:

- Every 5 minutes: Quick health check
- Every hour: Full integrity check
- On system startup: Comprehensive validation

## Error Severity Levels

- **Info**: Normal operation, no issues
- **Warning**: Non-critical issues that should be addressed
- **Error**: Critical issues requiring immediate attention
