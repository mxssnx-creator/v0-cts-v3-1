# Backup Files Directory

This directory contains backup copies of important files for recovery purposes.

## File Naming Convention

All backup files use the `.tmp` extension to prevent them from being compiled during the build process.

## Automated Page Backups

Timestamped backups of all critical pages are automatically created in subdirectories:
- Format: `pages-YYYY-MM-DDTHH-MM-SS-MMMZ/`
- Created on every deployment via `npm run vercel-build`
- Contains complete app structure with all critical pages
- Kept in Git for disaster recovery

To restore from automated backup:
```bash
# List available backups
ls -la backups/pages-*

# Restore all pages
cp -r backups/pages-[TIMESTAMP]/app/* app/

# Restore specific page
cp backups/pages-[TIMESTAMP]/app/settings/page.tsx app/settings/page.tsx
```

## Current Backups

- **trade-engine_backup_v3.1.ts.tmp** - Backup of original ContinuousTradeEngine before refactoring to GlobalTradeEngineCoordinator
- **settings-page_backup_v1.tsx.tmp** - Original settings page backup
- **settings-page_backup_v2.tsx.tmp** - Settings page backup version 2
- **settings-page_complete_backup.tsx.tmp** - Complete settings page backup
- **settings-page-backup-v3.tsx.tmp** - Settings page backup version 3
- **database-backup-v3.ts.tmp** - Database schema backup version 3

## Recovery Instructions

To recover from a backup:
1. Copy the `.tmp` file
2. Remove the `.tmp` extension
3. Move to the appropriate location in the project
4. Review and test thoroughly before deploying

## Page Protection System

The automated page protection system:
1. Creates timestamped backups before every build
2. Validates page integrity automatically
3. Prevents deployment if corruption detected
4. Auto-recovers from backups when needed

See `PAGE_PROTECTION_POLICY.md` and `DEPLOYMENT_PROTECTION.md` for details.

## Important Notes

- These files are NOT compiled during build
- Keep backups organized with version numbers
- Document significant changes in this README
- Never delete backups without confirmation
