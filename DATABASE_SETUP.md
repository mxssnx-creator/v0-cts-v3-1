# CTS v3 Database Setup Guide

## Predefined Database Credentials

The CTS v3 system comes with predefined PostgreSQL credentials for quick setup:

\`\`\`
Database Server: 83.229.86.105
Database Port: 5432
Database Name: cts-v3
Database User: cts
Database Password: 00998877
\`\`\`

## Connection String

\`\`\`
postgresql://cts:00998877@83.229.86.105:5432/cts-v3
\`\`\`

## Setup Options

### Option 1: Use Predefined Remote Database (Recommended for Production)

1. In Settings > System, select "Remote PostgreSQL" as database type
2. Click "Load Predefined Settings" button
3. Click "Initialize Database" to create tables
4. Click "Run Migrations" to apply all schema updates

### Option 2: Use Local PostgreSQL

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
   REMOTE_POSTGRES_URL=postgresql://cts:00998877@YOUR_SERVER_IP:5432/cts-v3
   \`\`\`

### Option 3: Use SQLite (Development Only)

1. In Settings > System, select "SQLite (Local)" as database type
2. Database file will be created automatically at `./data/cts.db`

## Vercel Environment Variables

Add these to your Vercel project settings:

\`\`\`
REMOTE_POSTGRES_URL=postgresql://cts:00998877@83.229.86.105:5432/cts-v3
DATABASE_URL=postgresql://cts:00998877@83.229.86.105:5432/cts-v3
DATABASE_TYPE=postgresql
SESSION_SECRET=00998877009988770099887700998877
JWT_SECRET=00998877009988770099887700998877
ENCRYPTION_KEY=00998877009988770099887700998877
API_SIGNING_SECRET=00998877009988770099887700998877
NEXT_PUBLIC_APP_URL=https://v0-cts-v3-1.vercel.app
NODE_ENV=development
\`\`\`

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
- Check database user has proper permissions
- Review migration logs for specific errors
