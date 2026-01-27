# CTS v3.1 Deployment Checklist

## Pre-Deployment

- [ ] Database URL configured in environment variables
- [ ] All API keys and secrets set
- [ ] Database migrations tested locally
- [ ] Build passes without errors
- [ ] All tests passing

## Ubuntu Server Setup

### 1. System Requirements
\`\`\`bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL (if using)
sudo apt-get install -y postgresql postgresql-contrib

# Install build tools
sudo apt-get install -y build-essential
\`\`\`

### 2. Application Setup
\`\`\`bash
# Clone or upload project
cd /opt
git clone <your-repo> cts-v3

# Or upload ZIP and extract
unzip cts-v3.zip -d /opt/cts-v3

# Install dependencies
cd /opt/cts-v3
npm install

# Build application
npm run build
\`\`\`

### 3. Environment Variables
\`\`\`bash
# Create .env.local file
cat > .env.local << EOF
NODE_ENV=production
DATABASE_URL=postgresql://user:password@localhost:5432/cts
SESSION_SECRET=your-session-secret-here
JWT_SECRET=your-jwt-secret-here
ENCRYPTION_KEY=your-encryption-key-here
API_SIGNING_SECRET=your-api-signing-secret-here
NEXT_PUBLIC_APP_URL=https://yourdomain.com
EOF

# Secure the file
chmod 600 .env.local
\`\`\`

### 4. Database Setup
\`\`\`bash
# Create PostgreSQL database
sudo -u postgres psql
postgres=# CREATE DATABASE cts;
postgres=# CREATE USER ctsuser WITH PASSWORD 'your-password';
postgres=# GRANT ALL PRIVILEGES ON DATABASE cts TO ctsuser;
postgres=# \q

# Migrations run automatically on first start
\`\`\`

### 5. Install Nginx
\`\`\`bash
# Run setup script
cd /opt/cts-v3
sudo bash scripts/setup-nginx.sh

# Install SSL certificate
sudo bash scripts/install-certbot.sh yourdomain.com admin@yourdomain.com
\`\`\`

### 6. Process Manager (PM2)
\`\`\`bash
# Install PM2
sudo npm install -g pm2

# Start application
cd /opt/cts-v3
pm2 start npm --name "cts-v3" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it outputs

# Monitor logs
pm2 logs cts-v3
\`\`\`

### 7. Firewall Configuration
\`\`\`bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
\`\`\`

## Post-Deployment Verification

- [ ] Application accessible via HTTPS
- [ ] Database migrations completed successfully
- [ ] All API endpoints responding
- [ ] Trade engine can start/stop
- [ ] Logs being written correctly
- [ ] SSL certificate valid
- [ ] Auto-renewal configured

## Monitoring Commands

\`\`\`bash
# Check application status
pm2 status

# View application logs
pm2 logs cts-v3

# Check nginx status
sudo systemctl status nginx

# View nginx error log
sudo tail -f /var/log/nginx/error.log

# Check database connections
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity WHERE datname='cts';"

# Monitor system resources
htop
\`\`\`

## Backup Commands

\`\`\`bash
# Backup database
sudo -u postgres pg_dump cts > /backups/cts-$(date +%Y%m%d).sql

# Backup application
tar -czf /backups/cts-app-$(date +%Y%m%d).tar.gz /opt/cts-v3

# Setup automated backups (cron)
sudo crontab -e
# Add: 0 2 * * * sudo -u postgres pg_dump cts > /backups/cts-$(date +\%Y\%m\%d).sql
\`\`\`

## Troubleshooting

### Application won't start
\`\`\`bash
# Check logs
pm2 logs cts-v3 --lines 100

# Check build
cd /opt/cts-v3
npm run build

# Check environment
cat .env.local
\`\`\`

### Database connection issues
\`\`\`bash
# Test connection
psql postgresql://user:password@localhost:5432/cts

# Check PostgreSQL status
sudo systemctl status postgresql

# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*-main.log
\`\`\`

### Nginx issues
\`\`\`bash
# Test configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx

# View error log
sudo tail -f /var/log/nginx/error.log
\`\`\`

## Maintenance

### Update Application
\`\`\`bash
cd /opt/cts-v3
git pull  # or upload new version
npm install
npm run build
pm2 restart cts-v3
\`\`\`

### Renew SSL Certificate
\`\`\`bash
# Test renewal
sudo certbot renew --dry-run

# Force renewal
sudo certbot renew --force-renewal
sudo systemctl reload nginx
\`\`\`

### Clean Old Logs
\`\`\`bash
# PM2 logs
pm2 flush

# Nginx logs
sudo find /var/log/nginx -name "*.log" -mtime +30 -delete

# Application logs
cd /opt/cts-v3
find data/logs -name "*.log" -mtime +7 -delete
