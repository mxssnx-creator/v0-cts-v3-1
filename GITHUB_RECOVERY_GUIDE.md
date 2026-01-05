# GitHub File Recovery Guide

## Overview

This guide explains how to recover specific files from previous Git commits without reverting your entire codebase. This is particularly useful when you want to restore working UI pages while keeping all the TypeScript compilation fixes.

## The Problem

During development, sometimes pages get accidentally modified or corrupted. Using Git's "undo" and "redo" requires re-applying all fixes, which is time-consuming and error-prone.

## The Solution

We can selectively recover specific files from previous commits using Git's `show` command, which retrieves historical file versions without affecting other files.

## Recovery Tool

### Location
`scripts/recover-from-github.ts`

### Usage

#### 1. List Recent Commits
```bash
bun scripts/recover-from-github.ts --list-commits
```

#### 2. Recover All Settings Pages (Recommended)
```bash
bun scripts/recover-from-github.ts --recover-settings
```

This will recover:
- Main Settings Page (`app/settings/page.tsx`)
- Main Indications Page (`app/settings/indications/main/page.tsx`)
- Auto Indications Page (`app/settings/indications/auto/page.tsx`)
- Optimal Indications Page (`app/settings/indications/optimal/page.tsx`)
- Common Indications Page (`app/settings/indications/common/page.tsx`)

All from commit `9cb416d` (v279) - the last known good version before settings destruction.

#### 3. Recover Specific File
```bash
bun scripts/recover-from-github.ts <commit-hash> <file-path>
```

Example:
```bash
bun scripts/recover-from-github.ts 9cb416d app/settings/page.tsx
```

## Key Commits

### v279 (Commit: 9cb416d)
- **Status:** Last known good version
- **Contains:** Complete settings pages with tabbed interface
- **Contains:** All indication settings pages
- **Contains:** Strategy management pages
- **Note:** This is BEFORE the high-performance database integration that caused issues

### Current (Latest)
- **Status:** Contains all TypeScript fixes
- **Contains:** High-performance database router fixes
- **Contains:** Exchange connector fixes
- **Missing:** Complete settings UI pages

## Recovery Strategy

### Recommended Approach

1. **First, recover all settings pages:**
   ```bash
   bun scripts/recover-from-github.ts --recover-settings
   ```

2. **Check if there are TypeScript errors:**
   ```bash
   bun run build
   ```

3. **If errors exist, fix only the recovered files:**
   - The tool preserves all fixes in other files
   - You only need to fix imports/exports in recovered pages
   - All database, connector, and engine fixes remain intact

4. **Test the recovered pages:**
   - Start dev server: `bun run dev`
   - Navigate to `/settings`
   - Verify all tabs work correctly

### Alternative: Manual Recovery via Git

If you prefer manual control:

```bash
# View file from specific commit
git show 9cb416d:app/settings/page.tsx

# Save to current location
git show 9cb416d:app/settings/page.tsx > app/settings/page.tsx

# Or save to backup first
git show 9cb416d:app/settings/page.tsx > backups/settings-recovered.tsx
```

## What Gets Preserved

✅ **Preserved (Not Affected):**
- All TypeScript compilation fixes
- Exchange connector implementations
- High-performance database router
- Database manager improvements
- System integrity checker
- All API routes fixes
- All library improvements

✅ **Recovered:**
- Complete settings UI pages
- Tabbed interface
- Indication configuration pages
- Strategy management pages
- All original functionality

## Troubleshooting

### Issue: "fatal: Path not in the working tree"
**Solution:** The file might not exist in that commit. Try:
```bash
bun scripts/recover-from-github.ts --list-commits
# Find a different commit hash
```

### Issue: TypeScript errors after recovery
**Solution:** The recovered files might reference old imports. Fix them:
1. Check error message for missing imports
2. Update import paths to match current structure
3. Most common fixes needed:
   - Component imports from `components/settings/*`
   - Type imports from `lib/types`
   - Hook imports from `hooks/*`

### Issue: Build succeeds but page is blank
**Solution:** Check browser console for errors:
1. Open DevTools (F12)
2. Check Console tab
3. Look for React errors
4. Usually caused by missing dependencies or state management issues

## Best Practices

1. **Always backup before recovery:**
   ```bash
   cp app/settings/page.tsx app/settings/page.tsx.backup
   ```

2. **Test immediately after recovery:**
   ```bash
   bun run dev
   # Navigate to the recovered page
   ```

3. **Commit recovered files separately:**
   ```bash
   git add app/settings/
   git commit -m "Recovered settings pages from v279"
   ```

4. **Document what you recovered:**
   - Add note to commit message
   - Update this guide if needed

## Emergency Recovery

If everything breaks after recovery:

```bash
# Restore from your backup
cp app/settings/page.tsx.backup app/settings/page.tsx

# Or revert the commit
git revert HEAD

# Or go back to previous version
git checkout HEAD~1 app/settings/page.tsx
```

## Future Prevention

1. **Create backups before major changes:**
   ```bash
   cp app/settings/page.tsx backups/settings-$(date +%Y%m%d).tsx
   ```

2. **Use feature branches:**
   ```bash
   git checkout -b feature/new-settings-ui
   # Make changes
   # Test thoroughly
   git checkout main
   git merge feature/new-settings-ui
   ```

3. **Commit frequently with clear messages:**
   ```bash
   git commit -m "feat: Add new settings tab"
   git commit -m "fix: Correct settings page imports"
   ```

## Support

If you need help with recovery:
1. Check this guide first
2. Review Git commit history: `git log --oneline -20`
3. Test recovery in a separate branch first
4. Document any issues for future reference

---

**Last Updated:** [Current Date]  
**Tool Version:** 1.0  
**Compatible With:** CTS v3.1
