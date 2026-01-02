# CTS v3 Installation Guide

Complete guide for installing CTS v3 via NPX or manual methods.

## Quick Start (NPX - Recommended)

### Option 1: Interactive Setup
\`\`\`bash
npx cts-setup
\`\`\`
This will:
- Check Node.js version (18-26 required)
- Install dependencies automatically
- Create `.env.local` configuration
- Build the application
- Provide next steps

### Option 2: Quick Download
\`\`\`bash
npx cts-download
\`\`\`
Downloads the repository and provides installation options.

### Option 3: Full Install (Linux/Ubuntu)
\`\`\`bash
npx cts-install
\`\`\`
Complete system installation with:
- System dependencies
- Database setup (SQLite/PostgreSQL)
- Systemd services
- Management scripts

## Manual Installation

### Prerequisites
- Node.js 18.x - 26.x
- npm, pnpm, or bun
- (Optional) PostgreSQL for production

### Step 1: Clone Repository
\`\`\`bash
git clone https://github.com/yourusername/cts-v3.git
cd cts-v3
\`\`\`

### Step 2: Run Setup
\`\`\`bash
npm run setup
# or
node scripts/setup.js
\`\`\`

### Step 3: Configure Environment
Edit `.env.local`:
\`\`\`env
DATABASE_URL="postgresql://cts:00998877@localhost:5432/cts-v3"
# or leave empty for SQLite (auto-created)

SESSION_SECRET="your-random-32-char-secret"
JWT_SECRET="your-random-32-char-secret"
\`\`\`

### Step 4: Start Application
\`\`\`bash
# Development
npm run dev

# Production
npm run build
npm start
\`\`\`

## Linux Production Installation

### Continuous Install (Automated)
\`\`\`bash
./scripts/install-continuous.sh --database sqlite --port 3000
\`\`\`

Options:
- `--database` or `-d`: sqlite, postgresql, remote-postgresql
- `--port` or `-p`: Web server port (default: 3000)
- `--project-name` or `-n`: Project name (default: cts-v3)

### Interactive Install
\`\`\`bash
./scripts/install.sh
\`\`\`

This creates:
- Systemd services (cts-web, cts-trade)
- Management scripts (start-cts.sh, stop-cts.sh, status-cts.sh, logs-cts.sh)
- Complete directory structure
- Database initialization

## Database Configuration

### SQLite (Default - Development)
Automatically created at `./data/cts.db`
- Zero configuration required
- Perfect for development and testing
- 54 migrations auto-run on first start

### PostgreSQL (Recommended - Production)
\`\`\`env
DATABASE_URL="postgresql://cts:00998877@localhost:5432/cts-v3"
DATABASE_TYPE="postgresql"
\`\`\`

Create database:
\`\`\`sql
CREATE DATABASE cts_v3;
\`\`\`

### Remote PostgreSQL
\`\`\`env
DATABASE_URL="postgresql://cts:00998877@83.229.86.105:5432/cts-v3"
DATABASE_TYPE="remote-postgresql"
\`\`\`

## Post-Installation Configuration

### 1. Database Migrations
Migrations run automatically on first app start:
- 54 total migrations
- Includes Auto indication setup
- Rate limiting configurations
- Performance optimizations

Check status:
\`\`\`bash
npm run db:status
\`\`\`

### 2. Exchange API Configuration
Navigate to: **Settings > Overall > Connection**

Add exchange connections:
- Bybit
- BingX
- Pionex
- OrangeX
- Binance
- OKX

### 3. Auto Indication Setup
Navigate to: **Settings > Indication > Main > Auto**

Configure:
- **8-Hour Analysis**: Historical market analysis window
- **Market Direction**: Short-term and long-term trend detection
- **Activity Threshold**: Progressive market activity detection

### 4. Strategy Configuration
Navigate to: **Settings > Strategy > Auto**

#### Block Strategy
- **3-Position Neutral Wait**: Wait logic when volume adjustment fails
- **Position Increment**: After optimal situation confirmation
- **Volume Management**: Controlled incremental increases

#### Level Strategy
- **Optimal Volume Incrementing**: Best working relative volume logic
- **Performance-Based**: Adapts to profitability metrics
- **Dynamic Ratios**: Adjusts based on market conditions

#### DCA Strategy
- **4-Step Maximum**: Controlled averaging down
- **2.5x Ratio Limit**: Maximum volume increase per step
- **Recovery Logic**: Profit back to positive tactics
- **Drawdown Management**: Smart position size adjustments

### 5. Enable Live Trading
Navigate to: **Dashboard > Connection Card**

1. Select active connection
2. Click **Settings** → **Strategies**
3. Choose main indication (Auto recommended)
4. Select additional strategies
5. Enable **Live Trade**

## Verification

### Check Services (Linux)
\`\`\`bash
./status-cts.sh
# or
systemctl status cts-web cts-trade
\`\`\`

### View Logs
\`\`\`bash
./logs-cts.sh
# or
journalctl -u cts-web -f
journalctl -u cts-trade -f
\`\`\`

### Access Application
- **Local**: http://localhost:3000
- **Network**: http://your-server-ip:3000

### System Monitoring
- **Monitoring Page**: http://localhost:3000/monitoring
- **Logistics Page**: http://localhost:3000/logistics

## Troubleshooting

### Application Won't Start
\`\`\`bash
# Check logs
npm run dev

# Check port availability
lsof -i:3000

# Rebuild dependencies
npm install --force
npm run build
\`\`\`

### Database Connection Issues
\`\`\`bash
# Check DATABASE_URL in .env.local
cat .env.local | grep DATABASE

# Test PostgreSQL connection
psql $DATABASE_URL -c "SELECT version();"

# For SQLite, check file exists
ls -la data/cts.db
\`\`\`

### Migration Failures
\`\`\`bash
# Migrations run automatically on app start
# Check logs for migration status
npm run dev 2>&1 | grep -i migration

# Manual migration check
npm run db:status
\`\`\`

### Native Module Issues
\`\`\`bash
# Rebuild native modules
npm rebuild better-sqlite3 sharp

# Or with pnpm
pnpm rebuild better-sqlite3 sharp

# Clean install
rm -rf node_modules package-lock.json
npm install
\`\`\`

## Production Deployment

### System Requirements
- Ubuntu 22.04/24.04, Debian 11+, or CentOS 8+
- 2GB RAM minimum (4GB recommended)
- 10GB disk space minimum
- Node.js 18.x - 26.x
- PostgreSQL 14+ (recommended for production)

### Security Checklist
- [ ] Change default password immediately
- [ ] Use strong SESSION_SECRET and JWT_SECRET
- [ ] Configure PostgreSQL with secure credentials
- [ ] Enable firewall (allow only necessary ports)
- [ ] Set up SSL/TLS certificates
- [ ] Configure regular database backups
- [ ] Enable automatic updates
- [ ] Monitor logs regularly
- [ ] Use exchange API keys with IP restrictions
- [ ] Enable 2FA on exchange accounts

### Performance Optimization
- [ ] Use PostgreSQL for production
- [ ] Enable automatic data cleanup (configured by default)
- [ ] Configure proper retention periods (7 days default)
- [ ] Monitor database size regularly
- [ ] Set up log rotation
- [ ] Configure rate limiting per exchange
- [ ] Use time-window query optimization (enabled by default)

### Backup Strategy
\`\`\`bash
# Database backup (SQLite)
cp data/cts.db backups/cts-$(date +%Y%m%d).db

# Database backup (PostgreSQL)
pg_dump $DATABASE_URL > backups/cts-$(date +%Y%m%d).sql

# Automated backup setup
# See scripts/backup.sh for automation
\`\`\`

## Updates

### Update Application
\`\`\`bash
# Pull latest changes
git pull origin main

# Update dependencies
npm install

# Rebuild application
npm run build

# Restart services (Linux)
./stop-cts.sh
./start-cts.sh

# Or manual restart
npm start
\`\`\`

### Migration Updates
Migrations run automatically on app start. New migrations are applied seamlessly.

## Support

For issues or questions:
1. Check logs: `./logs-cts.sh` or `npm run dev`
2. Review documentation: PRODUCTION_SETUP.md
3. Check monitoring page: http://localhost:3000/monitoring
4. Verify configuration: `.env.local`

## Next Steps

1. **Complete Configuration**
   - Add exchange API keys
   - Configure Auto indication
   - Set up strategies (Block/Level/DCA)

2. **Test on Testnet**
   - Enable testnet mode in Settings
   - Start with small position sizes
   - Monitor performance

3. **Go Live**
   - Switch to mainnet
   - Configure proper risk limits
   - Enable live trading
   - Monitor continuously

4. **Optimize**
   - Adjust strategy parameters based on performance
   - Fine-tune Auto indication settings
   - Review and optimize volume ratios
   - Analyze profitability metrics

---

**Installation completed!** Your CTS v3 system is ready for crypto trading with advanced Auto indication strategies.
