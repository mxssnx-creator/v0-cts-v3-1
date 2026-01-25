# CTS v3.1 Build Troubleshooting Guide

## Common Build Errors and Solutions

### Error: Module has no exported member

**Symptom:**
\`\`\`
error TS2724: '"@/lib/trade-engine/trade-engine"' has no exported member named 'getTradeEngine'
\`\`\`

**Cause:** Stale TypeScript/Turbopack cache referencing old module paths.

**Solution:**
\`\`\`bash
# Clear all caches and rebuild
npm run clean
npm run build

# Or complete clean with node_modules
npm run clean:all
\`\`\`

---

### Error: Configuration file not found

**Symptom:**
\`\`\`
Module '"./types"' has no exported member 'ConfigurationSet'
\`\`\`

**Cause:** Ghost files in build cache that don't exist in source.

**Solution:**
\`\`\`bash
# Remove TypeScript incremental cache
rm -f tsconfig.tsbuildinfo

# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build
\`\`\`

---

### Error: Cannot find module

**Symptom:**
\`\`\`
Cannot find module '@/lib/configuration-set-manager'
\`\`\`

**Cause:** File was moved or deleted but cache still references it.

**Solution:**
\`\`\`bash
# Use the prebuild script (runs automatically)
node scripts/prebuild.js

# Or manually clear specific caches
rm -rf .next .turbo node_modules/.cache
\`\`\`

---

## Cache Management

### Quick Cache Clear
\`\`\`bash
npm run clean
\`\`\`

### Deep Cache Clear
\`\`\`bash
npm run clean:all
\`\`\`

### Manual Cache Clear
\`\`\`bash
# Remove Next.js cache
rm -rf .next

# Remove Turbopack cache
rm -rf .turbo

# Remove TypeScript build info
rm -f tsconfig.tsbuildinfo

# Remove node modules cache
rm -rf node_modules/.cache
\`\`\`

---

## Build Process

### Development Build
\`\`\`bash
npm run dev
\`\`\`

### Production Build
\`\`\`bash
# Standard build
npm run build

# Clean build (recommended after major changes)
npm run rebuild
\`\`\`

### Type Checking Only
\`\`\`bash
npm run type-check
\`\`\`

---

## Common Issues

### 1. Stale Module References

**Problem:** Build fails with "module not found" but file exists.

**Fix:**
\`\`\`bash
npm run clean
npm run build
\`\`\`

### 2. TypeScript Incremental Cache Issues

**Problem:** TypeScript errors persist after fixing code.

**Fix:**
\`\`\`bash
rm -f tsconfig.tsbuildinfo
npm run type-check
\`\`\`

### 3. Turbopack Cache Corruption

**Problem:** Random build failures or incorrect module resolution.

**Fix:**
\`\`\`bash
rm -rf .next .turbo
npm run dev
\`\`\`

### 4. Node Modules Cache Issues

**Problem:** Dependencies not resolving correctly.

**Fix:**
\`\`\`bash
npm run clean:all
\`\`\`

---

## Prebuild Validation

The `prebuild.js` script automatically:
- Clears TypeScript incremental cache
- Validates critical files exist
- Removes stray configuration files
- Checks for common issues

It runs automatically before `npm run build`.

---

## Best Practices

1. **After pulling changes:** Run `npm run clean` before building
2. **After major refactoring:** Run `npm run clean:all`
3. **Before deployment:** Run `npm run type-check` to catch issues early
4. **If stuck:** Try `npm run rebuild` for a fresh build

---

## Getting Help

If build issues persist:
1. Check this troubleshooting guide
2. Review error messages carefully
3. Try a complete clean: `npm run clean:all`
4. Check file paths and imports are correct
5. Ensure all dependencies are installed: `npm install`

---

## Environment Issues

### Missing Environment Variables
\`\`\`bash
# Check if .env.local exists
ls -la .env.local

# Run setup to configure
npm run setup
\`\`\`

### Database Connection Issues
\`\`\`bash
# Check database status
npm run db:status

# Run migrations
npm run db:migrate
\`\`\`

### Port Conflicts
\`\`\`bash
# Use custom port
PORT=3001 npm run dev

# Or set in .env.local
echo "PORT=3001" >> .env.local
