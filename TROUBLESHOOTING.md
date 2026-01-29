# Troubleshooting Guide

## Common Issues & Solutions

### Issue: Database file not created on startup
**Solution:**
1. Delete `crypto_trading.db` file if it exists
2. Restart the dev server
3. Visit http://localhost:3000
4. Check browser console for `[v0]` debug logs
5. If still failing, run: `node scripts/init-db.js` from root directory

### Issue: Login page shows "Invalid username or password"
**Solution:**
1. Make sure credentials are exactly: `Admin / 00998877`
2. Check that database was initialized (visit /api/system/status)
3. If database exists but admin missing, visit /install and click "Reset Database"
4. Verify `/scripts/init-db.js` completes without errors

### Issue: DatabaseInitializer shows "Database initialization failed"
**Solution:**
1. Check browser console for detailed error message
2. Visit `/api/system/status` directly to see actual status
3. If database corrupted, visit `/install` and click "Reset Database"
4. Check server logs for `[v0]` messages
5. Verify `better-sqlite3` is installed: `npm list better-sqlite3`

### Issue: API endpoints return 500 errors
**Solution:**
1. Check server console for error details
2. Verify database file exists at `./crypto_trading.db`
3. Check file permissions are readable/writable
4. Run `/api/install/reset` to recreate database
5. Check that all tables exist: `/api/install/migrations-status`

### Issue: Tables don't exist (migrations not running)
**Solution:**
1. Visit `/app/install` page
2. Click "Initialize Database" button
3. Check status notification for success/error
4. Click "Run Migrations" button
5. Verify with `/api/install/migrations-status` endpoint

### Issue: Session/Cookie issues after login
**Solution:**
1. Clear browser cookies for localhost
2. Log out (delete auth_token cookie)
3. Log back in with Admin / 00998877
4. Check that session cookie is set (Network tab)
5. Verify HttpOnly flag in production

### Issue: "Database is locked" errors
**Solution:**
1. Ensure only one Node.js process is running
2. Delete `crypto_trading.db-wal` and `crypto_trading.db-shm` files
3. Restart dev server
4. WAL mode helps concurrency, but sometimes needs reset

### Issue: Admin user not found but database exists
**Solution:**
1. Visit `/api/install/reset` endpoint
2. This will recreate database with default admin user
3. Or manually: `node scripts/init-db.js`
4. Verify admin with: `SELECT * FROM users WHERE username='Admin'`

## Debug Commands

### Check Database Status
```bash
# Via API
curl http://localhost:3000/api/system/status

# Via CLI
node scripts/init-db.js
```

### Check Migration Status
```bash
curl http://localhost:3000/api/install/migrations-status
```

### Get System Metrics
```bash
curl http://localhost:3000/api/structure/metrics
```

### Manual Database Reset
```bash
# Delete and recreate
rm crypto_trading.db
rm crypto_trading.db-wal
rm crypto_trading.db-shm
node scripts/init-db.js
```

### Check Admin User
```bash
# Via API
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"Admin","password":"00998877"}'
```

## Browser Console Debug Tips

### Check DatabaseInitializer logs
Open DevTools Console and look for `[v0]` messages:
```
[v0] Checking database status...
[v0] Initializing database...
[v0] Database initialized successfully
```

### Check API responses
Visit these endpoints in browser:
- http://localhost:3000/api/system/status
- http://localhost:3000/api/install/migrations-status
- http://localhost:3000/api/structure/metrics

### Check Network requests
1. Open DevTools → Network tab
2. Refresh page or try login
3. Look for API calls to `/api/system/status`, `/api/install/initialize`, etc.
4. Check response bodies for error details

## Performance Tips

### If database is slow:
1. WAL mode is already enabled (best for SQLite)
2. Check disk space available
3. Consider archiving old `trading_history` records
4. Run VACUUM: `db.exec('VACUUM')`

### If initialization is slow:
1. Normal for first run (creates all tables)
2. Subsequent loads should be instant
3. If slow on repeated runs, check disk I/O

## Security Checklist

- [x] Passwords hashed (currently SHA256, upgrade to bcrypt)
- [x] Session cookies set as HttpOnly
- [x] Default admin user created automatically
- [x] Admin endpoint requires proper auth
- [x] Database file not in version control

## Next Steps if Everything Works

1. ✅ Login with Admin / 00998877 works
2. ✅ Dashboard loads successfully
3. ✅ Install page shows system status
4. ✅ Migrations are complete
5. ✅ Create new user accounts
6. ✅ Add trading presets
7. ✅ Start using the app!

## Support

If issues persist:
1. Check all `[v0]` debug messages in console
2. Verify `/api/system/status` returns proper values
3. Check `/INITIALIZATION_SETUP.md` for overview
4. Review `/IMPLEMENTATION_CHECKLIST.md` for what was done
5. Manually run: `node scripts/init-db.js -v` for verbose output
