# Deployment Protection System

## Overview

This system ensures that no pages are corrupted or lost during development and deployment.

## Protection Layers

### Layer 1: Pre-Build Validation
Every build automatically validates all critical pages before proceeding.

```bash
npm run build
# Runs: validate-pages-integrity.ts → next build
```

### Layer 2: Automatic Backups
Timestamped backups are created before every deployment.

```bash
npm run vercel-build
# Runs: backup-pages.ts → validate → recover → build
```

### Layer 3: Corruption Detection
Real-time validation checks for:
- Missing files
- Empty files (< 100 bytes)
- Missing exports
- Placeholder variables
- Missing imports
- Missing JSX content

### Layer 4: Auto-Recovery
If corruption detected, system automatically attempts recovery from:
1. Latest local backup
2. GitHub commit 9cb416d (v279)
3. Manual intervention required

## Build Process Flow

```
1. npm run vercel-build
   ↓
2. npm run protect:pages
   ↓
3. npm run backup:pages → Creates timestamped backup
   ↓
4. npm run validate:pages → Validates all pages
   ↓
5. If validation passes → Continue
   ↓
6. npm run recover:settings → Recover corrupted files
   ↓
7. npm run clean:aggressive → Clean caches
   ↓
8. npm run build → Next.js build
   ↓
9. Deployment to Vercel
```

## Critical Pages Protected

Total: 17 critical pages monitored

- Dashboard & Core: 3 pages
- Settings: 5 pages
- Trading & Analysis: 5 pages
- Management: 4 pages

## Validation Checks

Each page must pass:
1. File exists
2. File size > 100 bytes
3. Contains `export default`
4. Contains imports
5. Contains JSX (return statement with < >)
6. No placeholder variables (${VAR}, {{VAR}}, %%%VAR%%%)
7. Not just comments or whitespace

## Manual Commands

### Check Page Integrity
```bash
bun scripts/validate-pages-integrity.ts
cat PAGE_INTEGRITY_REPORT.md
```

### Create Manual Backup
```bash
bun scripts/backup-pages.ts
```

### Recover from Backup
```bash
# List backups
ls -la backups/

# Restore all pages
cp -r backups/pages-[LATEST]/app/* app/

# Restore one page
cp backups/pages-[LATEST]/app/settings/page.tsx app/settings/page.tsx
```

### Recover from GitHub
```bash
# List available commits
bun scripts/recover-from-github.ts --list-commits

# Recover settings pages from v279
bun scripts/recover-from-github.ts --recover-settings

# Recover custom files
bun scripts/recover-from-github.ts --commit 9cb416d --files app/settings/page.tsx
```

## Failure Handling

### Build Fails Due to Corruption

1. Build aborts immediately
2. Check `PAGE_INTEGRITY_REPORT.md`
3. Corrupted files listed with issues
4. Run recovery: `bun scripts/recover-from-github.ts --recover-settings`
5. Re-validate: `bun scripts/validate-pages-integrity.ts`
6. Retry build

### Recovery Options Priority

1. **Latest Local Backup** (fastest)
   - Located in `backups/pages-[TIMESTAMP]/`
   - Created on every build

2. **GitHub v279** (reliable)
   - Commit: 9cb416d
   - Last known fully working version
   - Use for settings pages

3. **Manual Reconstruction** (last resort)
   - Review PAGE_PROTECTION_POLICY.md
   - Check documentation
   - Rebuild from specifications

## Prevention Guidelines

### DO:
- Always read files before editing
- Test changes locally before deployment
- Run validation before commits
- Create manual backup before major changes

### DON'T:
- Use placeholder variables in actual code
- Delete files without verification
- Skip validation checks
- Ignore corruption warnings
- Edit files without reading them first

## Monitoring

### Validation Reports
Generated on every build: `PAGE_INTEGRITY_REPORT.md`

Contents:
- Timestamp
- Total pages checked
- Intact vs corrupted count
- Detailed corruption analysis
- File sizes and issues

### Backup Logs
Each backup creates directory: `backups/pages-[TIMESTAMP]/`

Naming format: `pages-YYYY-MM-DDTHH-MM-SS-MMMZ`

## Integration with CI/CD

### Vercel Deployment
```yaml
# Automatic in package.json
vercel-build:
  - protect:pages (backup + validate)
  - recover:settings (if needed)
  - clean:aggressive
  - build
```

### GitHub Actions (if configured)
```yaml
- name: Validate Pages
  run: bun scripts/validate-pages-integrity.ts
  
- name: Build
  run: npm run build
```

## Troubleshooting

### "Page validation failed"
- Check `PAGE_INTEGRITY_REPORT.md`
- Restore from backup or GitHub
- Re-run validation

### "Backup creation failed"
- Check disk space: `df -h`
- Check permissions: `chmod +x scripts/backup-pages.ts`
- Verify backups directory exists: `mkdir -p backups`

### "Recovery failed"
- Ensure Git repository access
- Check network connection
- Use manual backup restore

## Best Practices

1. **Before Major Refactoring**
   ```bash
   bun scripts/backup-pages.ts
   ```

2. **After Corruption**
   ```bash
   bun scripts/validate-pages-integrity.ts
   # Check report
   # Restore from backup/GitHub
   ```

3. **Regular Maintenance**
   - Weekly: Review PAGE_INTEGRITY_REPORT.md
   - Monthly: Clean old backups (keep 10+)
   - Quarterly: Test recovery procedures

4. **Git Commits**
   - Commit backups directory
   - Include PAGE_INTEGRITY_REPORT.md
   - Document any manual interventions

## Support

If protection system fails:
1. Stop all development
2. Document the issue
3. Restore from last known good backup
4. Review logs and reports
5. Update protection rules if needed
