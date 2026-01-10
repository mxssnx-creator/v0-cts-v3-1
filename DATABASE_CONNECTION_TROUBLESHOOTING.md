# Database Connection Troubleshooting Guide

## Quick Fix for "password authentication failed"

Your error shows:
```
PostgreSQL connection string: file:./data/db.sqlite
password authentication failed for user "root"
```

This means your DATABASE_URL is incorrectly formatted.

## SOLUTION

### Step 1: Create or Edit .env.local

Create a file named `.env.local` in your project root with:

```bash
DATABASE_URL=postgresql://cts:00998877@83.229.86.105:5432/cts-v3
SESSION_SECRET=00998877009988770099887700998877
JWT_SECRET=00998877009988770099887700998877
ENCRYPTION_KEY=00998877009988770099887700998877
API_SIGNING_SECRET=00998877009988770099887700998877
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 2: Restart Your Application

```bash
# Stop the current process (Ctrl+C)
# Then restart:
npm run dev
```

### Step 3: Verify Connection

Check the console output. You should see:
```
[v0] Valid PostgreSQL DATABASE_URL detected, using PostgreSQL
[v0] PostgreSQL connection details:
  - Host: 83.229.86.105
  - Port: 5432
  - Database: cts-v3
  - User: cts
[v0] PostgreSQL database connection established successfully
```

## Alternative Database Options

### Option 1: Predefined Remote (Recommended)
```bash
DATABASE_URL=postgresql://cts:00998877@83.229.86.105:5432/cts-v3
```
- Pre-configured and ready to use
- No setup required
- Production-ready

### Option 2: Local PostgreSQL
```bash
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/cts-v3
```
1. Install PostgreSQL locally
2. Create database: `createdb cts-v3`
3. Update credentials in .env.local

### Option 3: SQLite (Development Only)
```bash
DATABASE_TYPE=sqlite
SQLITE_DB_PATH=./data/cts.db
```
- No external server needed
- Not recommended for production

## Vercel Deployment

Add these environment variables in Vercel Dashboard:

```
DATABASE_URL=postgresql://cts:00998877@83.229.86.105:5432/cts-v3
DATABASE_TYPE=postgresql
SESSION_SECRET=00998877009988770099887700998877
JWT_SECRET=00998877009988770099887700998877
ENCRYPTION_KEY=00998877009988770099887700998877
API_SIGNING_SECRET=00998877009988770099887700998877
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production
```

## Common Errors and Fixes

### Error: "password authentication failed"
**Cause**: Wrong username or password
**Fix**: Use correct credentials (cts:00998877) or update in .env.local

### Error: "ECONNREFUSED"
**Cause**: Database server not accessible
**Fix**: Check firewall, verify server is running, test with `pg_isready`

### Error: "getaddrinfo ENOTFOUND"
**Cause**: Cannot resolve hostname
**Fix**: Check internet connection, use IP instead of hostname

### Error: "Connection test timed out"
**Cause**: Network latency or firewall
**Fix**: Increase timeout or check network settings

## Testing Database Connection

### Using psql Command Line:
```bash
psql postgresql://cts:00998877@83.229.86.105:5432/cts-v3
```

### Using Node.js Script:
```javascript
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://cts:00998877@83.229.86.105:5432/cts-v3'
});

pool.query('SELECT NOW()', (err, res) => {
  console.log(err ? 'Error:' : 'Connected:', err || res.rows[0]);
  pool.end();
});
```

## Still Having Issues?

1. Check `.env.local` exists in project root
2. Verify no typos in DATABASE_URL
3. Restart development server
4. Check firewall allows port 5432
5. Review logs for specific error messages
6. Try SQLite for testing: `DATABASE_TYPE=sqlite`

## Support

For additional help:
- Check logs in console
- Review DATABASE_SETUP.md
- Verify all environment variables are set
- Test database connection independently
