# CTS v3 Database Setup Guide

## Default Database Configuration

**CTS v3 now uses SQLite as the default database** - no configuration required!

## Setup Options

### Option 1: Use SQLite (Default - Recommended for most users)

**Zero Configuration Required:**
1. SQLite is automatically configured when no DATABASE_URL is set
2. Database file is created automatically at `./data/cts.db`
3. All tables and migrations are applied on first run
4. Perfect for development, testing, and single-server deployments

**To use SQLite explicitly:**
1. In Settings > System, select "SQLite (Local)" as database type
2. Click "Initialize Database" to create tables
3. Click "Run Migrations" to apply all schema updates

### Option 2: Use Remote PostgreSQL (For multi-server or cloud deployments)

**Predefined Database Credentials:**

\`\`\`
Database Server: 83.229.86.105
Database Port: 5432
Database Name: cts-v3
Database User: cts
Database Password: 00998877
Connection String: postgresql://cts:00998877@83.229.86.105:5432/cts-v3
\`\`\`

**Setup Steps:**
1. In Settings > System, select "Remote PostgreSQL" as database type
2. Click "Load Predefined Settings" button
3. Click "Initialize Database" to create tables
4. Click "Run Migrations" to apply all schema updates

### Option 3: Use Local PostgreSQL (Advanced)

1. Install PostgreSQL on your server:
   \`\`\`bash
   sudo bash scripts/install-postgres-remote.sh
   \`\`\`
   
2. The script will use the predefined credentials automatically:
   - DB Name: cts-v3
   - DB User: cts
   - DB Password: 00998877

3. Update your connection string in Vercel environment variables:
   \`\`\`
   DATABASE_URL=postgresql://cts:00998877@YOUR_SERVER_IP:5432/cts-v3
   \`\`\`

## Vercel Environment Variables

**For SQLite (Default):**
\`\`\`
# SQLite requires no DATABASE_URL - just omit it or leave empty
SESSION_SECRET=00998877009988770099887700998877
JWT_SECRET=00998877009988770099887700998877
ENCRYPTION_KEY=00998877009988770099887700998877
API_SIGNING_SECRET=00998877009988770099887700998877
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production
\`\`\`

**For PostgreSQL (Optional):**
Add these to your Vercel project settings:

\`\`\`
DATABASE_URL=postgresql://cts:00998877@83.229.86.105:5432/cts-v3
REMOTE_POSTGRES_URL=postgresql://cts:00998877@83.229.86.105:5432/cts-v3
SESSION_SECRET=00998877009988770099887700998877
JWT_SECRET=00998877009988770099887700998877
ENCRYPTION_KEY=00998877009988770099887700998877
API_SIGNING_SECRET=00998877009988770099887700998877
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production
\`\`\`

## Database Type Detection

The system automatically determines the database type:

1. **If DATABASE_URL is not set or empty** → Uses SQLite (default)
2. **If DATABASE_URL starts with "postgresql://"** → Uses PostgreSQL
3. **Manual override available** in Settings > System

## Automatic Database Type Changes

The system now automatically resets database connections when you change the database type in Settings > System. After changing the type:

1. The database clients are automatically closed and reset
2. Next database query will use the new database type
3. No manual restart required

## Testing Connection

1. Go to Settings > Overall > Connections
2. Select any exchange connection
3. Click "Test Connection"
4. View detailed connection logs

Connection test now includes:
- Balance verification
- API capabilities check
- Detailed error logging
- 30-second timeout protection

## Troubleshooting

**Using SQLite but data not persisting:**
- Check that `./data` directory exists and is writable
- Verify file permissions on `./data/cts.db`
- Review application logs for SQLite errors

**Connection Test Fails:**
- Verify API keys are correct
- Check if exchange API is accessible
- Review connection test log for details
- Ensure minimum connect interval is set (default: 200ms)

**Database Type Change Not Working:**
- Check Settings > System for current database type
- Verify environment variables in Vercel
- Database clients reset automatically on type change
- Check server logs for reconnection messages

**Migration Errors:**
- Ensure database is initialized first
- Check database user has proper permissions (PostgreSQL only)
- Review migration logs for specific errors
- SQLite migrations apply automatically

## When to Use Each Database Type

**Use SQLite when:**
- Running on a single server
- Development or testing
- Simpler deployment without external database
- Data size under 100GB
- Lower concurrent user load

**Use PostgreSQL when:**
- Running multiple server instances
- Need advanced features (replication, clustering)
- High concurrent user load
- Larger datasets (100GB+)
- Enterprise requirements
