# Files to Restore from v75 (commit b8c8a3ce27ff6169ed0c2e1a096cd1aa5063e958)

## Primary Settings Files

### Main Page
- `app/settings/page.tsx` - Main settings page with tabs and layout

### Settings Components (components/settings/)
- `exchange-connection-manager.tsx` - Exchange API connection management
- `install-manager.tsx` - Installation and database setup
- `preset-connection-manager.tsx` - Preset connection management
- `logs-viewer.tsx` - System logs viewer
- `auto-indication-settings.tsx` - Auto indication configuration
- `active-advanced-indication-settings.tsx` - Advanced indication settings
- `statistics-overview.tsx` - System statistics display
- `exchange-config.tsx` - Exchange configuration component
- `connection-settings-dialog.tsx` - Connection settings dialog
- `connection-info-dialog.tsx` - Connection info display
- `connection-log-dialog.tsx` - Connection log viewer
- `exchange-connection-dialog.tsx` - Exchange connection setup dialog
- `exchange-connection-settings-dialog.tsx` - Exchange connection settings
- `connection-predefinition-selector.tsx` - Predefined connection selector

## Sub-pages (if they exist in v75)
- `app/settings/overall/connection/page.tsx` - Connection settings sub-page
- `app/settings/indications/main/page.tsx` - Main indication settings
- `app/settings/indications/auto/page.tsx` - Auto indication settings
- `app/settings/indications/common/page.tsx` - Common indication settings
- `app/settings/indications/optimal/page.tsx` - Optimal indication settings

## API Routes
- `app/api/settings/route.ts` - Settings API endpoint
- `app/api/settings/connections/route.ts` - Connections API

## Supporting Files
- Any related types or utilities used by these components

## Recovery Strategy

1. **Fetch from GitHub commit b8c8a3ce27ff6169ed0c2e1a096cd1aa5063e958:**
   - Main settings page
   - All settings components
   - All settings sub-pages
   - Related API routes

2. **Keep Current Files:**
   - `components/settings/threshold-management.tsx` (new feature)
   - `components/settings/auto-recovery-control.tsx` (new feature)
   - System health monitor (already working)

3. **Integration Steps:**
   - After restoring v75 files, add threshold and auto-recovery as new tabs/sections
   - Maintain v75 design and structure
   - Only add new features without changing existing layout
