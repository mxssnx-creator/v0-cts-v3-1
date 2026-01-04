# Database Setup Guide - CTS v3.1

## Quick Start

### Option 1: Use SQLite (Development - Easiest)

No configuration needed! SQLite will be used automatically if no DATABASE_URL is set.

```bash
# Just run the app - database will be created automatically
npm run dev
```

The database file will be created at `./data/cts.db`.

### Option 2: Use PostgreSQL (Production Recommended)

#### Step 1: Set up your PostgreSQL database

You need a PostgreSQL server (local or remote) with:
- PostgreSQL 12 or higher
- A database created (e.g., `cts-v3`)
- A user with full permissions on that database

#### Step 2: Configure your DATABASE_URL

Create a `.env.local` file in the project root:

```env
DATABASE_URL="postgresql://username:password@host:port/database"
```

**Format breakdown:**
- `username`: Your PostgreSQL username (e.g., `cts`, `postgres`)
- `password`: Your PostgreSQL password
- `host`: Database server address (e.g., `localhost`, `83.229.86.105`)
- `port`: Database port (default is `5432`)
- `database`: Database name (e.g., `cts-v3`)

**Example for local PostgreSQL:**
```env
DATABASE_URL="postgresql://postgres:mypassword@localhost:5432/cts"
```

**Example for remote PostgreSQL:**
```env
DATABASE_URL="postgresql://cts:securepass@83.229.86.105:5432/cts-v3"
```

#### Step 3: Generate secure secrets

The app uses secrets for authentication and encryption. In production, generate secure random strings:

```bash
# On Linux/Mac:
openssl rand -hex 32

# On Windows (PowerShell):
[System.Convert]::ToBase64String((1..32|%{Get-Random -Max 256}))
```

Add to your `.env.local`:
```env
SESSION_SECRET="your-generated-secret-here"
JWT_SECRET="your-generated-secret-here"
ENCRYPTION_KEY="your-generated-secret-here"
API_SIGNING_SECRET="your-generated-secret-here"
```

#### Step 4: Run the app

```bash
npm run dev
```

The database will be initialized automatically on first startup!

## Common Issues & Solutions

### Issue: "password authentication failed"

**Cause:** Wrong username or password in DATABASE_URL

**Solution:**
1. Verify your PostgreSQL credentials
2. Test connection directly:
   ```bash
   psql "postgresql://username:password@host:port/database"
   ```
3. Update your `.env.local` with correct credentials

### Issue: "Connection refused" or "ECONNREFUSED"

**Cause:** Database server not accessible

**Solutions:**
- Check if PostgreSQL is running
- Verify firewall allows connection on port 5432
- For remote databases, ensure the IP is whitelisted
- Try `telnet host 5432` to test connectivity

### Issue: "database does not exist"

**Cause:** Database not created yet

**Solution:**
Create the database first:
```sql
CREATE DATABASE "cts-v3";
```

Or using psql:
```bash
createdb cts-v3
```

### Issue: "SSL connection required"

**Cause:** Production database requires SSL

**Solution:**
The app automatically uses SSL in production. If you get SSL errors, your DATABASE_URL might need additional parameters:
```env
DATABASE_URL="postgresql://user:pass@host:port/db?sslmode=require"
```

## Database Architecture

The application uses:
- **SQLite**: For development and small deployments
- **PostgreSQL**: For production and multi-user deployments

Both are fully supported and migrations work on both systems.

### Tables Created Automatically

The system creates these essential tables on first run:
- `site_logs` - System logging
- `users` - User accounts
- `connections` - Exchange connections
- `trade_history` - Trading records
- `performance_metrics` - Analytics
- And many more...

## Manual Database Management

### Run migrations manually:
```bash
npm run db:migrate
```

### Check database status:
```bash
npm run db:status
```

### Reset database (CAUTION - deletes all data):
```bash
npm run db:reset
```

## Production Checklist

Before deploying to production:

- [ ] PostgreSQL database created
- [ ] DATABASE_URL configured correctly
- [ ] Secure secrets generated (not default values)
- [ ] Database user has appropriate permissions
- [ ] Firewall configured for database access
- [ ] SSL/TLS enabled for database connections
- [ ] Regular backups configured
- [ ] Connection pooling limits set appropriately
- [ ] Tested database connection from production environment

## Support

If you continue to have database issues:
1. Check the logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test database connectivity outside the app
4. Ensure PostgreSQL version is 12 or higher
```

```typescript file="" isHidden
