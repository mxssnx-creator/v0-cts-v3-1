# Project Backup System

## Overview
Manual backup system that creates a complete project snapshot in `backups/latest/`. Each new backup overwrites the previous one, keeping only the most recent version.

## Usage

### Create Backup
Creates a complete backup of the entire project (excluding build artifacts and dependencies):

```bash
bun run backup:create
```

What gets backed up:
- All source files (`app/`, `components/`, `lib/`, etc.)
- Configuration files
- Scripts
- Documentation

What gets excluded:
- `node_modules/`
- `.next/`
- `.vercel/`
- `.git/`
- `backups/` (prevents recursive backups)
- Build artifacts and logs

### List Backup Contents
View backup information and available files:

```bash
bun run backup:list
```

### Restore Files
Restore a specific file or directory from the backup:

```bash
# Restore a single file
bun run backup:restore app/settings/page.tsx

# Restore a directory
bun run backup:restore app/settings

# Restore multiple files
bun run backup:restore app/page.tsx components/dashboard.tsx
```

## Backup Location
- **Location:** `backups/latest/`
- **Behavior:** Each backup completely replaces the previous one
- **Metadata:** `backups/latest/BACKUP_INFO.json` contains backup timestamp and file count

## Use Cases

### Before Major Changes
```bash
bun run backup:create
# Make your changes...
# If something breaks:
bun run backup:restore app/settings/page.tsx
```

### Recovery from GitHub + Local Backup
```bash
# 1. Create backup of current state
bun run backup:create

# 2. Recover from GitHub (with link provided)
bun run recover:settings

# 3. If GitHub version missing features, restore specific files from backup
bun run backup:restore components/settings/threshold-management.tsx
```

### Quick Rollback
```bash
# Restore an entire section
bun run backup:restore app/settings
```

## Backup Metadata
Each backup includes `BACKUP_INFO.json` with:
- Creation timestamp
- Total files backed up
- Excluded patterns
- Purpose/message

## Best Practices
1. **Create backup before major refactoring**
2. **Create backup before GitHub recovery operations**
3. **Create backup before deployment** (automated in build process)
4. **Keep backup fresh** - create new backup after completing major features

## Integration with Recovery System
The backup system works together with GitHub recovery:
1. Create backup of current working state
2. Recover older version from GitHub
3. Selectively restore new features from backup
4. Integrate old structure with new functionality
