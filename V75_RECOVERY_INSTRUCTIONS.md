# V75 Settings Recovery Instructions

## What This Does

This recovery process restores the complete settings page from version 75 (commit `b8c8a3ce27ff6169ed0c2e1a096cd1aa5063e958`) and integrates the new threshold management features.

## Files Recovered from V75

1. **app/settings/page.tsx** - Main settings page with tabbed interface
2. **app/settings/layout.tsx** - Settings layout wrapper
3. **components/settings/exchange-connection-manager.tsx** - Exchange connection management
4. **components/settings/install-manager.tsx** - Installation and setup management

## New Features Added After Recovery

### Threshold Management (System Tab)
- Position limit configuration for all types (Base, Main, Real, Preset, Optimal, Auto)
- Automatic cleanup monitoring with 20% buffer system
- Real-time utilization tracking
- Manual cleanup controls

### Auto-Recovery System (System Tab)
- Service health monitoring for:
  - Database connections
  - Position threshold manager
  - Trade engine coordinator
- Automatic recovery actions
- Manual restart capabilities
- Recovery history tracking

## How to Execute Recovery

### Option 1: Standard Recovery (Recommended)
```bash
bun run recover:v75
```

This will:
1. Create backups of current files in `backups/pre-v75-recovery/`
2. Download v75 versions from GitHub
3. Replace current files with v75 versions

### Option 2: Recovery + Auto-Integration
```bash
bun run recover:v75:force
```

This will:
1. Execute standard recovery
2. Automatically integrate threshold management features
3. Merge new components into the System tab

## Manual Integration (If Needed)

If you want to manually integrate threshold features after recovery:

1. Add imports to `app/settings/page.tsx`:
```typescript
import { ThresholdManagement } from "@/components/settings/threshold-management"
import { AutoRecoveryControl } from "@/components/settings/auto-recovery-control"
```

2. Add components to the System tab:
```tsx
<Card>
  <CardHeader>
    <CardTitle>Position Threshold Management</CardTitle>
    <CardDescription>
      Configure position limits and automatic cleanup thresholds
    </CardDescription>
  </CardHeader>
  <CardContent>
    <ThresholdManagement />
  </CardContent>
</Card>

<Card>
  <CardHeader>
    <CardTitle>Auto-Recovery System</CardTitle>
    <CardDescription>
      Monitor and manage automatic recovery for critical services
    </CardDescription>
  </CardHeader>
  <CardContent>
    <AutoRecoveryControl />
  </CardContent>
</Card>
```

## Verification

After recovery, verify the settings page:

```bash
# Check page structure
cat app/settings/page.tsx | grep -E "export default|TabsContent"

# Validate page integrity
bun run validate:pages

# Test build
bun run build
```

## Rollback

If something goes wrong, restore from backup:

```bash
# Backups are in: backups/pre-v75-recovery/
cp backups/pre-v75-recovery/app/settings/page.tsx app/settings/page.tsx
```

## API Routes Required

The threshold management features require these API routes (already created):

- `/api/system/threshold-config` - GET/POST threshold configuration
- `/api/system/threshold-stats` - GET real-time threshold statistics
- `/api/system/threshold-monitor` - GET monitoring data
- `/api/system/threshold-cleanup` - POST manual cleanup trigger
- `/api/system/auto-recovery-status` - GET recovery system status
- `/api/system/auto-recovery-monitor` - GET service health data
- `/api/system/auto-recovery-restart` - POST restart services

## Components Required

Ensure these components exist:

- `components/settings/threshold-management.tsx`
- `components/settings/auto-recovery-control.tsx`
- `components/settings/exchange-connection-manager.tsx`
- `components/settings/install-manager.tsx`

## Next Steps

1. Run the recovery: `bun run recover:v75:force`
2. Review the recovered settings page
3. Test all tabs and functionality
4. Verify threshold management is working
5. Deploy to Vercel
