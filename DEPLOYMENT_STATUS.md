# CTS v3.1 Deployment Status & Guide

## Current Build Configuration

### TypeScript Compilation
- **Incremental Builds**: DISABLED (prevents cache issues)
- **Composite Mode**: DISABLED
- **Skip Lib Check**: ENABLED (faster builds)
- **Type Checking**: Runs before build in `vercel-build` script

### Cache Management
All builds automatically clear:
- `.next` directory (Next.js build cache)
- `.turbo` directory (Turbopack cache)
- `node_modules/.cache` (npm/TypeScript cache)
- All `*.tsbuildinfo` files (TypeScript incremental build info)
- Stray configuration files

### Build Process (Vercel)

**Step 1: Install**
```bash
npm install --legacy-peer-deps
```
Automatically clears caches during `preinstall` hook.

**Step 2: Pre-build**
```bash
npm run prebuild
```
Runs `scripts/prebuild.js` to clear all caches and validate environment.

**Step 3: Type Check**
```bash
npm run type-check
```
Ensures all TypeScript files compile without errors using fresh cache.

**Step 4: Build**
```bash
npm run build
```
Next.js production build with Turbopack.

## Known Issues & Fixes

### Issue: TypeScript reports "Cannot find module '@/hooks/use-toast'"
**Cause**: Stale TypeScript cache referencing old module paths.
**Fix**: Run `npm run clean` or let `preinstall` clear caches automatically.
**Status**: ✅ FIXED - Automatic cache clearing in place.

### Issue: "Export getTradeEngine doesn't exist"
**Cause**: Files importing from wrong module path.
**Current Path**: Both pause and resume routes correctly import from `@/lib/trade-engine`
**Status**: ✅ FIXED - All imports verified correct.

### Issue: Module resolution errors during build
**Cause**: Turbopack caching incorrect module paths.
**Fix**: Disabled incremental builds and added aggressive cache clearing.
**Status**: ✅ FIXED - Fresh compilation on every build.

## Environment Variables Required

### Production (Vercel)
```env
REMOTE_POSTGRES_URL=postgresql://...
SESSION_SECRET=<generated-secret>
JWT_SECRET=<generated-secret>
ENCRYPTION_KEY=<generated-secret>
API_SIGNING_SECRET=<generated-secret>
NEXT_PUBLIC_APP_URL=<auto-set-by-vercel>
```

### Local Development
```env
NODE_ENV=development
DATABASE_URL=./cts.db
SESSION_SECRET=<generated-by-setup>
JWT_SECRET=<generated-by-setup>
ENCRYPTION_KEY=<generated-by-setup>
API_SIGNING_SECRET=<generated-by-setup>
NEXT_PUBLIC_APP_URL=http://localhost:3000
PORT=3000
```

## Local Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Run setup script (generates secrets, creates DB)
npm run setup

# 3. Start development server
npm run dev
```

## Manual Cache Clearing

If you encounter build issues:

```bash
# Clear Next.js and TypeScript caches
npm run clean

# Nuclear option - clear everything including node_modules
npm run clean:all

# Then rebuild
npm run rebuild
```

## Deployment Checklist

- [ ] All environment variables configured in Vercel dashboard
- [ ] Database connection tested (REMOTE_POSTGRES_URL)
- [ ] Secrets generated and added to environment
- [ ] Build command set to: `npm run vercel-build`
- [ ] Install command set to: `npm install --legacy-peer-deps`
- [ ] Node.js version: 18.x or 20.x selected
- [ ] Framework preset: Next.js
- [ ] Root directory: `./` (project root)

## Post-Deployment Verification

After deployment completes, verify:

```bash
# 1. Check deployment logs for errors
# 2. Visit /api/health (should return 200 OK)
# 3. Check database connectivity
# 4. Verify TradeEngine status at /api/trade-engine/status
# 5. Test authentication flow
```

## Troubleshooting

### Build fails with "Type error" during type-check
1. Check if the error is from a backup file (backups/*.tmp should be ignored)
2. Verify tsconfig.json excludes backup files
3. Clear local cache: `npm run clean`
4. Try build again

### Build succeeds but runtime errors
1. Check environment variables are set correctly
2. Verify database migrations ran: `npm run db:status`
3. Check Next.js logs for missing modules
4. Verify all required secrets are present

### Module not found errors
1. This usually indicates stale cache
2. Run `npm run clean:all` locally
3. For Vercel: trigger fresh deployment (no cache reuse)
4. Check that all imports use correct paths

## Success Indicators

When deployment is successful, you should see:

```
✓ Type checking completed without errors
✓ Generating static pages (14/14)
✓ Collecting build traces
✓ Build completed successfully
```

## Current Status: READY FOR DEPLOYMENT ✅

All configuration files have been updated to ensure:
- Automatic cache clearing before builds
- Proper TypeScript configuration
- Correct module resolution
- No stale cache issues
- Fresh compilation every build
