# CTS v3.1 Setup Guide

## Quick Start

### Option 1: NPX (Recommended for Testing)
```bash
npx create-cts-app my-trading-system
cd my-trading-system
npm run dev
```

### Option 2: Clone and Setup
```bash
git clone https://github.com/your-repo/cts-v3.1.git
cd cts-v3.1
npm install
npm run setup
npm run dev
```

## Database Configuration

### PostgreSQL (Production)
The system is pre-configured with PostgreSQL credentials:
- **Host**: 83.229.86.105
- **Port**: 5432
- **User**: project-name
- **Password**: 00998877
- **Database**: cts-v3

Connection string:
```
postgresql://project-name:00998877@83.229.86.105:5432/cts-v3
```

### SQLite (Development)
For local development, SQLite is automatically configured:
```
file:./data/db.sqlite
```

## Setup Process

The `npm run setup` command will:

1. **Check System Requirements**
   - Node.js version (18.x - 26.x required)
   - Package manager detection
   - Git availability

2. **Project Configuration**
   - Set project name
   - Configure port (default: 3000)
   - Choose database type

3. **Install Dependencies**
   - Automatically installs all required packages
   - Rebuilds native modules (better-sqlite3, sharp)

4. **Create Directory Structure**
   - data/
   - logs/
   - backups/database/
   - public/uploads/

5. **Environment Setup**
   - Generate secure secrets (32 bytes each)
   - Create .env.local file
   - Configure database connection

6. **Database Initialization**
   - Test database connection
   - Create essential tables
   - Set up indexes
   - Run initial migrations

7. **Build Application** (Optional)
   - TypeScript type checking
   - Production bundle creation

## Environment Variables

The setup automatically generates secure values for:

- `SESSION_SECRET` - Session encryption
- `JWT_SECRET` - JWT token signing
- `ENCRYPTION_KEY` - Data encryption
- `API_SIGNING_SECRET` - API request signing

**IMPORTANT**: Never commit `.env.local` to version control!

## Troubleshooting

### Database Connection Issues

**PostgreSQL "password authentication failed"**
```bash
# Check credentials in .env.local
cat .env.local | grep DATABASE_URL

# Test connection manually
psql postgresql://project-name:00998877@83.229.86.105:5432/cts-v3
```

**SQLite permission errors**
```bash
# Ensure data directory is writable
chmod -R 755 data/
```

### Build Errors

**Turbopack cache issues**
```bash
# Clear all caches
npm run clean:local

# Rebuild completely
npm run rebuild
```

**TypeScript errors**
```bash
# Check for type errors
npm run type-check

# Fix common issues
rm -rf node_modules
npm install
```

### Port Already in Use
```bash
# Change port in .env.local
PORT=3001

# Or specify when starting
PORT=3001 npm run dev
```

## Post-Setup Configuration

After setup completes, configure the system:

1. **Start the application**
   ```bash
   npm run dev
   ```

2. **Access dashboard**
   ```
   http://localhost:3000
   ```

3. **Add Exchange Connections**
   - Navigate to Settings > Overall > Connection
   - Add API keys for your exchanges
   - Test connections

4. **Configure Trading**
   - Enable Auto Indication System
   - Set up Block/Level/DCA strategies
   - Configure risk parameters

5. **Activate Live Trading**
   - Review all settings
   - Enable live trading when ready
   - Monitor initial trades

## Commands Reference

### Development
```bash
npm run dev           # Start development server
npm run dev:nocache   # Start without clearing cache
```

### Production
```bash
npm run build         # Build for production
npm start             # Start production server
```

### Database
```bash
npm run db:migrate    # Run migrations
npm run db:status     # Check database status
npm run db:backup     # Create database backup
npm run db:reset      # Reset database (WARNING: deletes all data)
```

### Maintenance
```bash
npm run clean         # Clear build caches
npm run clean:local   # Clear local caches aggressively
npm run rebuild       # Clean and rebuild
npm run verify        # Verify build integrity
```

### System
```bash
npm run system:check  # System health check
npm run system:health # Detailed health report
```

## Security Best Practices

1. **Change default credentials** before production deployment
2. **Use strong passwords** for database connections
3. **Enable HTTPS** in production
4. **Keep API keys secure** in .env.local
5. **Regular backups** of database
6. **Update dependencies** regularly
7. **Monitor logs** for suspicious activity

## Getting Help

- Documentation: Check all .md files in project root
- Issues: GitHub Issues page
- Logs: Check logs/ directory for error details
- Database: Run `npm run db:status` for diagnostic info

## Next Steps

1. Complete the Post-Setup Configuration
2. Review [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md) before going live
3. Read [DATABASE_CREDENTIALS.md](./DATABASE_CREDENTIALS.md) for security info
4. Check [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for production deployment
