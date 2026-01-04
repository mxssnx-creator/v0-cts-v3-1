# CTS v3.1 - Complete Deployment Guide

**Last Updated:** 2025-01-04  
**Version:** 3.1.0  
**Status:** Production Ready

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Production Environment Setup](#production-environment-setup)
3. [Database Configuration](#database-configuration)
4. [Security Hardening](#security-hardening)
5. [Performance Tuning](#performance-tuning)
6. [Monitoring Setup](#monitoring-setup)
7. [Backup Strategy](#backup-strategy)
8. [Post-Deployment Verification](#post-deployment-verification)

---

## 1. Pre-Deployment Checklist

### System Requirements
- ✅ Node.js 20.x or higher
- ✅ PostgreSQL 14+ or SQLite 3.40+
- ✅ 4GB RAM minimum (8GB recommended)
- ✅ 20GB disk space minimum
- ✅ SSL certificate (for HTTPS)

### Environment Verification
```bash
# Check Node.js version
node --version  # Should be 20.x+

# Check npm version
npm --version   # Should be 9.x+

# Check PostgreSQL (if using)
psql --version  # Should be 14.x+

# Check available disk space
df -h

# Check available memory
free -h
```

### Code Preparation
```bash
# Pull latest code
git pull origin main

# Install dependencies
npm ci --only=production

# Run type checking
npm run type-check

# Build application
npm run build

# Verify build output
ls -la .next/
```

---

## 2. Production Environment Setup

### Environment Variables

Create `.env.production`:

```bash
# Application
PROJECT_NAME=CTS-v3-Production
PORT=3000
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production

# Database (PostgreSQL recommended for production)
DATABASE_URL=postgresql://cts_user:secure_password@localhost:5432/cts_production
REMOTE_POSTGRES_URL=postgresql://cts_user:secure_password@backup-host:5432/cts_production

# Security (Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
SESSION_SECRET=<generated-32-byte-hex>
JWT_SECRET=<generated-32-byte-hex>
ENCRYPTION_KEY=<generated-32-byte-hex>
API_SIGNING_SECRET=<generated-32-byte-hex>
```

### Generate Secure Secrets
```bash
# Generate all secrets at once
node -e "const crypto = require('crypto'); 
console.log('SESSION_SECRET=' + crypto.randomBytes(32).toString('hex'));
console.log('JWT_SECRET=' + crypto.randomBytes(32).toString('hex'));
console.log('ENCRYPTION_KEY=' + crypto.randomBytes(32).toString('hex'));
console.log('API_SIGNING_SECRET=' + crypto.randomBytes(32).toString('hex'));"
```

### PM2 Process Manager (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'cts-v3-production',
    script: 'npm',
    args: 'start',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOF

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
```

---

## 3. Database Configuration

### PostgreSQL Setup (Recommended)

```bash
# Install PostgreSQL
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE cts_production;
CREATE USER cts_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE cts_production TO cts_user;
\c cts_production
GRANT ALL ON SCHEMA public TO cts_user;
EOF

# Run migrations
npm run db:migrate

# Verify tables created
psql -U cts_user -d cts_production -c "\dt"
```

### PostgreSQL Performance Tuning

Edit `/etc/postgresql/14/main/postgresql.conf`:

```conf
# Memory Settings
shared_buffers = 2GB                    # 25% of total RAM
effective_cache_size = 6GB              # 75% of total RAM
maintenance_work_mem = 512MB
work_mem = 32MB

# Checkpoint Settings
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100

# Query Planner
random_page_cost = 1.1                  # SSD
effective_io_concurrency = 200          # SSD

# Logging
log_min_duration_statement = 1000       # Log slow queries (>1s)
log_checkpoints = on
log_connections = on
log_disconnections = on
```

Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

---

## 4. Security Hardening

### Firewall Configuration

```bash
# Install UFW
sudo apt-get install ufw

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow PostgreSQL (only from localhost)
sudo ufw allow from 127.0.0.1 to any port 5432

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### SSL Certificate (Let's Encrypt)

```bash
# Install certbot
sudo apt-get install certbot

# Get certificate
sudo certbot certonly --standalone -d your-domain.com

# Certificate files will be at:
# /etc/letsencrypt/live/your-domain.com/fullchain.pem
# /etc/letsencrypt/live/your-domain.com/privkey.pem

# Auto-renewal (certbot does this automatically)
sudo certbot renew --dry-run
```

### Nginx Reverse Proxy

```bash
# Install nginx
sudo apt-get install nginx

# Create configuration
sudo cat > /etc/nginx/sites-available/cts << 'EOF'
upstream cts_backend {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://cts_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/cts /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

---

## 5. Performance Tuning

### Node.js Optimization

```bash
# Set Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Enable production optimizations
export NODE_ENV=production

# Disable source maps (faster)
export NEXT_DISABLE_SOURCEMAPS=true
```

### Database Indexes

Verify all critical indexes exist:

```sql
-- Check existing indexes
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Should see 50+ indexes including:
-- idx_connections_active
-- idx_positions_connection_symbol
-- idx_orders_status
-- etc.
```

### Log Rotation

```bash
# Create logrotate configuration
sudo cat > /etc/logrotate.d/cts << 'EOF'
/var/log/cts/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
```

---

## 6. Monitoring Setup

### Health Check Endpoint

Test the health endpoint:
```bash
curl https://your-domain.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-04T12:00:00.000Z",
  "checks": {
    "database": "healthy",
    "tradeEngine": "healthy",
    "exchanges": "healthy"
  }
}
```

### Uptime Monitoring

Use external monitoring service:
- **UptimeRobot** (free): https://uptimerobot.com
- **Pingdom** (paid): https://www.pingdom.com
- **StatusCake** (free/paid): https://www.statuscake.com

Configure to check `/api/health` every 5 minutes.

### Application Monitoring

```bash
# PM2 monitoring
pm2 monit

# View logs
pm2 logs cts-v3-production

# Check memory usage
pm2 show cts-v3-production
```

---

## 7. Backup Strategy

### Database Backup

Create automated backup script:

```bash
#!/bin/bash
# /opt/cts/scripts/backup-database.sh

BACKUP_DIR="/var/backups/cts"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="cts_production"
DB_USER="cts_user"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/cts_${DATE}.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "cts_*.sql.gz" -mtime +30 -delete

# Log completion
echo "Backup completed: cts_${DATE}.sql.gz" >> $BACKUP_DIR/backup.log
```

Make executable and add to cron:
```bash
chmod +x /opt/cts/scripts/backup-database.sh

# Add to crontab (daily at 2 AM)
crontab -e
0 2 * * * /opt/cts/scripts/backup-database.sh
```

### Application Backup

```bash
# Backup logs and configuration
tar -czf /var/backups/cts/app_$(date +%Y%m%d).tar.gz \
    /opt/cts/logs \
    /opt/cts/.env.production \
    /opt/cts/ecosystem.config.js
```

---

## 8. Post-Deployment Verification

### System Health Checklist

```bash
# 1. Check application is running
curl https://your-domain.com/

# 2. Check health endpoint
curl https://your-domain.com/api/health

# 3. Verify database connection
psql -U cts_user -d cts_production -c "SELECT COUNT(*) FROM users;"

# 4. Check PM2 status
pm2 status

# 5. Verify nginx is running
sudo systemctl status nginx

# 6. Check SSL certificate
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# 7. Test authentication
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'

# 8. Monitor logs
tail -f logs/trade-engine/*.txt
```

### Performance Verification

```bash
# Run load test (requires Apache Bench)
ab -n 1000 -c 10 https://your-domain.com/

# Should see:
# - Requests per second > 50
# - Time per request < 200ms
# - Failed requests = 0
```

### Security Audit

```bash
# Check open ports
sudo netstat -tulpn | grep LISTEN

# Should only see:
# - 22 (SSH)
# - 80 (HTTP redirect)
# - 443 (HTTPS)
# - 5432 (PostgreSQL on localhost only)

# Check SSL configuration
curl -I https://your-domain.com | grep -i "strict-transport"
# Should see: Strict-Transport-Security header
```

---

## Troubleshooting

### Application Won't Start

```bash
# Check logs
pm2 logs cts-v3-production --lines 100

# Check environment variables
pm2 env 0

# Rebuild application
npm run build
pm2 restart cts-v3-production
```

### Database Connection Issues

```bash
# Test connection
psql -U cts_user -d cts_production -c "SELECT 1;"

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log

# Verify permissions
psql -U postgres -c "\du"
```

### High Memory Usage

```bash
# Check memory usage
pm2 show cts-v3-production

# Restart application
pm2 restart cts-v3-production

# Set memory limit
pm2 delete cts-v3-production
pm2 start ecosystem.config.js --max-memory-restart 1G
```

---

## Maintenance Schedule

### Daily
- Monitor health dashboard
- Check error logs
- Verify backup completion

### Weekly
- Review performance metrics
- Update dependencies (if needed)
- Check disk space

### Monthly
- Full system audit
- Security updates
- Database optimization (VACUUM, ANALYZE)
- Review and rotate API keys

---

**Document Version:** 1.0  
**Maintained By:** CTS Development Team  
**Support:** https://github.com/your-repo/issues
