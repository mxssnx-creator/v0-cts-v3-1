# Database Credentials Configuration

## PostgreSQL Connection

The system is configured to use PostgreSQL with the following credentials:

**Connection Details:**
- Host: `83.229.86.105`
- Port: `5432`
- Database: `cts-v3`
- Username: `project-name`
- Password: `00998877`

**Full Connection String:**
```
postgresql://project-name:00998877@83.229.86.105:5432/cts-v3
```

## Configuration Files

The credentials are configured in:

1. **`.env.example`** - Template file with default credentials
2. **`scripts/setup.js`** - Setup script with default connection string
3. **`.env.local`** - Your local environment file (created during setup)

## Setup Instructions

### Option 1: Automatic Setup (Recommended)

Run the setup script which will automatically configure the database:

```bash
npm run setup
```

When prompted, select PostgreSQL and accept the default connection settings.

### Option 2: Manual Configuration

Create or update your `.env.local` file:

```bash
# Database Configuration
DATABASE_URL="postgresql://project-name:00998877@83.229.86.105:5432/cts-v3"
REMOTE_POSTGRES_URL="postgresql://project-name:00998877@83.229.86.105:5432/cts-v3"
```

Then run migrations:

```bash
npm run db:migrate
```

## Security Notes

- **Production**: Change the default password in production environments
- **Access**: Ensure the PostgreSQL server allows connections from your IP
- **SSL**: Consider enabling SSL for production deployments
- **Firewall**: Port 5432 must be accessible from your application server

## Testing Connection

You can test the database connection using:

```bash
npm run db:status
```

This will verify:
- Database connectivity
- Schema status
- Pending migrations
- Connection pool health

## Troubleshooting

### Connection Refused
- Check if PostgreSQL server is running
- Verify firewall rules allow port 5432
- Confirm your IP is whitelisted

### Authentication Failed
- Double-check username: `project-name`
- Double-check password: `00998877`
- Verify database `cts-v3` exists

### Permission Errors
- Ensure user has CREATE, SELECT, INSERT, UPDATE, DELETE privileges
- Check if user can create tables and indexes

## Database Initialization

On first run, the system will automatically:
1. Create all required tables
2. Set up indexes for performance
3. Run all pending migrations
4. Initialize system settings

No manual database setup is required beyond providing the connection string.
