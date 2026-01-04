# shadcn/ui Components Guide for CTS v3.1

## Current Configuration

The project uses shadcn/ui with the following setup:
- **Style**: New York
- **React Server Components**: Enabled
- **TypeScript**: Enabled
- **CSS Variables**: Enabled
- **Base Color**: Neutral
- **Icon Library**: Lucide React

## All Components Already Installed

The following shadcn components are already installed and configured:

### Layout Components
- `accordion` - Collapsible content sections
- `card` - Content containers with header/footer
- `separator` - Visual dividers
- `tabs` - Tabbed navigation
- `sheet` - Slide-over panels

### Form Components
- `button` - Clickable buttons with variants
- `input` - Text input fields
- `label` - Form labels
- `select` - Dropdown selects
- `switch` - Toggle switches
- `checkbox` - Checkboxes
- `radio-group` - Radio button groups
- `slider` - Range sliders
- `textarea` - Multi-line text inputs

### Feedback Components
- `alert` - Alert messages
- `badge` - Status badges
- `toast` / `toaster` - Toast notifications
- `progress` - Progress bars
- `skeleton` - Loading skeletons
- `spinner` - Loading spinners

### Overlay Components
- `dialog` - Modal dialogs
- `dropdown-menu` - Dropdown menus
- `popover` - Popovers
- `tooltip` - Tooltips
- `alert-dialog` - Confirmation dialogs

### Data Display
- `table` - Data tables
- `avatar` - User avatars
- `scroll-area` - Scrollable areas
- `chart` - Chart components (using Recharts)

## Adding New Components

If you need to add a component that's not yet installed:

```bash
npx shadcn@latest add [component-name]
```

For example:
```bash
npx shadcn@latest add calendar
npx shadcn@latest add date-picker
npx shadcn@latest add command
```

## Available Components Not Yet Installed

You can add these components if needed:
- `calendar` - Date calendar
- `date-picker` - Date selection
- `command` - Command palette
- `context-menu` - Right-click menus
- `hover-card` - Hover cards
- `menubar` - Menu bars
- `navigation-menu` - Navigation menus
- `pagination` - Pagination controls
- `resizable` - Resizable panels
- `sonner` - Alternative toast library
- `toggle` - Toggle buttons
- `toggle-group` - Toggle button groups

## Using Components

Import components from `@/components/ui`:

```tsx
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

export function MyComponent() {
  const { toast } = useToast()
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Example</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={() => toast({ title: "Success!" })}>
          Click me
        </Button>
      </CardContent>
    </Card>
  )
}
```

## Troubleshooting

### Registry Errors
If you see registry errors when adding components, ensure:
1. Your internet connection is stable
2. The component name is correct
3. You're using the latest version: `npx shadcn@latest`

### Import Errors
If components can't be imported:
1. Check that the component is in `components/ui/`
2. Verify the import path uses `@/components/ui/`
3. Ensure TypeScript paths are configured in `tsconfig.json`

### Styling Issues
If components look unstyled:
1. Verify `app/globals.css` is imported in `app/layout.tsx`
2. Check that CSS variables are defined in `globals.css`
3. Ensure Tailwind CSS is properly configured

## Custom Components

Custom components are located in:
- `components/dashboard/` - Dashboard-specific components
- `components/settings/` - Settings page components
- `components/presets/` - Preset management components
- `components/ui/` - shadcn/ui components (don't modify directly)

## Theme Customization

CSS variables are defined in `app/globals.css` under the `:root` and `.dark` selectors. Modify these to customize the theme:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  --primary: 0 0% 9%;
  --primary-foreground: 0 0% 98%;
  /* ... more variables ... */
}
