# Page Protection Policy

**CRITICAL**: This document defines pages that must NEVER be corrupted, replaced, or erased.

## Protection Rules

### Rule 1: Always Read Before Write
**NEVER** write to a page without reading it first to understand its current content.

### Rule 2: Validate Before Deploy
Run `bun scripts/validate-pages-integrity.ts` before every deployment.

### Rule 3: Backup Before Changes
Run `bun scripts/backup-pages.ts` before making significant changes.

### Rule 4: No Placeholder Variables
**NEVER** use placeholder variables like `${VARIABLE}`, `{{VARIABLE}}`, or `<PLACEHOLDER>` in actual page code.

### Rule 5: Minimum Code Standards
- Every page must have `export default`
- Every page must have imports
- Every page must return JSX
- Every page must be > 100 bytes

## Protected Pages

### Core Dashboard
- `app/page.tsx` - Main Dashboard
- `app/monitoring/page.tsx` - System Monitoring
- `app/live-trading/page.tsx` - Live Trading Interface

### Configuration Pages
- `app/settings/page.tsx` - Main Settings Hub
- `app/settings/indications/main/page.tsx` - Main Indications
- `app/settings/indications/auto/page.tsx` - Auto Indications
- `app/settings/indications/common/page.tsx` - Common Settings
- `app/settings/indications/optimal/page.tsx` - Optimal Settings

### Trading & Analysis
- `app/indications/page.tsx` - Indications Overview
- `app/strategies/page.tsx` - Strategies Management
- `app/presets/page.tsx` - Preset Configuration
- `app/sets/page.tsx` - Configuration Sets
- `app/analysis/page.tsx` - Analysis Tools

### Management Pages
- `app/logistics/page.tsx` - System Logistics
- `app/structure/page.tsx` - System Structure
- `app/alerts/page.tsx` - Alert Management
- `app/statistics/page.tsx` - Statistics Dashboard

## Corruption Detection

### Signs of Corruption
1. File size < 100 bytes
2. Missing `export default`
3. Contains placeholder variables
4. No imports present
5. No JSX content
6. File not found

### Recovery Process
If corruption detected:
1. **STOP** all development immediately
2. Run `bun scripts/validate-pages-integrity.ts` to identify corrupted files
3. Restore from most recent backup in `backups/pages-*`
4. If no backup exists, recover from GitHub using `scripts/recover-from-github.ts`
5. Validate recovered files before continuing

## Integration with Build Process

The page validation runs automatically:
- Before `bun run build`
- Before `bun run vercel-build`
- Before deployment to Vercel

If validation fails, the build is aborted.

## Manual Validation

Run anytime to check page integrity:
```bash
# Validate all pages
bun scripts/validate-pages-integrity.ts

# Create backup
bun scripts/backup-pages.ts

# Check specific page
bun scripts/validate-pages-integrity.ts app/settings/page.tsx
```

## Emergency Recovery

If critical pages are corrupted:
```bash
# Recover from latest backup
cp -r backups/pages-[LATEST]/* .

# Or recover from GitHub (v279 = last known good)
bun scripts/recover-from-github.ts --commit 9cb416d --files app/settings/page.tsx
