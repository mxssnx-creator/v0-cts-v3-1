# Exchange Selection System Documentation

## Architecture Overview

The Exchange Selection system follows a clear hierarchy from base connection configuration through active connection coordination to system-wide connection selection.

## Connection Flow

### 1. Base Connections (Settings → Overall → Connection)
- **Location**: `app/settings/overall/connection/page.tsx`
- **Purpose**: Raw exchange API credential management
- **Data Fields**:
  - Connection name and exchange type
  - API credentials (key, secret, passphrase)
  - Connection method (REST, WebSocket)
  - Testnet vs production
  - `is_enabled`: Controls if connection appears in Active Connections list

**Important**: Base connections do NOT contain trading parameters like volume factors or profit factors.

### 2. Active Connections (Dashboard)
- **Location**: `app/page.tsx` - "Active Connections" section
- **Purpose**: Connections activated for live trading with trading parameters
- **Data Fields** (in addition to base):
  - Volume factors
  - Profit factors
  - Max positions
  - Strategy and indication settings
  - `is_active`: TRUE when added to Active Connections

**Flow**:
1. User enables connection in Base Settings (`is_enabled = true`)
2. Connection appears in "Add Connection" dropdown on Dashboard
3. User adds connection → `is_active` set to TRUE
4. Connection now has trading parameters and appears in Exchange Selection

### 3. Exchange Selection (System-Wide)
- **API Endpoint**: `/api/connections/active`
- **Purpose**: Provides list of connections for dropdown selectors
- **Query**: `SELECT * FROM exchange_connections WHERE is_active = true`
- **Used In**:
  - Live Trading page (`app/live-trading/page.tsx`)
  - Analysis page (`app/analysis/page.tsx`)
  - Settings → Exchange tab (`app/settings/page.tsx`)
  - Any page with connection filtering

## Database States

| State | is_enabled | is_active | Location | Meaning |
|-------|-----------|-----------|----------|---------|
| **Disabled** | FALSE | FALSE | Base Settings only | Connection exists but not usable |
| **Enabled** | TRUE | FALSE | Base Settings + Dashboard add dialog | Ready to activate for trading |
| **Active** | TRUE | TRUE | All Exchange Selection dropdowns | Live trading connection |

## API Endpoints

### GET /api/connections/active
Returns only active connections for exchange selection dropdowns.

```typescript
// Response format
[
  {
    id: "conn-123",
    name: "Bybit Main",
    exchange: "bybit",
    is_testnet: false,
    is_enabled: true,
    is_active: true,
    last_test_status: "success",
    created_at: "2024-01-15T10:30:00Z"
  }
]
```

### GET /api/settings/connections
Returns ALL connections (used in settings pages for management).

```typescript
// Response format
{
  connections: [
    {
      id: "conn-123",
      name: "Bybit Main",
      exchange: "bybit",
      is_enabled: true,
      is_active: true,
      // ... full connection data including credentials
    }
  ]
}
```

## Implementation Examples

### Fetching Active Connections
```typescript
const [connections, setConnections] = useState([])

useEffect(() => {
  const loadConnections = async () => {
    const res = await fetch("/api/connections/active")
    if (res.ok) {
      const data = await res.json()
      setConnections(data)
    }
  }
  loadConnections()
}, [])
```

### Exchange Selection Dropdown
```tsx
<Select value={selectedConnection} onValueChange={setSelectedConnection}>
  <SelectTrigger>
    <SelectValue placeholder="Select connection" />
  </SelectTrigger>
  <SelectContent>
    {connections.map((conn) => (
      <SelectItem key={conn.id} value={conn.id}>
        {conn.name} ({conn.exchange})
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

## Best Practices

1. **Always use `/api/connections/active`** for Exchange Selection dropdowns
2. **Never show disabled connections** (`is_enabled = false`) in trading UIs
3. **Base Settings** manage only credentials, not trading parameters
4. **Active Connections** layer adds trading configuration
5. **Exchange Selection** shows only `is_active = true` connections

## Error Handling

### No Active Connections
```tsx
if (connections.length === 0) {
  return (
    <div className="text-center py-12">
      <h3>No Active Connections</h3>
      <p>Add connections to "Active Connections" on Dashboard first.</p>
      <Button onClick={() => router.push("/")}>Go to Dashboard</Button>
    </div>
  )
}
```

### Connection Lost
When a connection becomes unavailable:
1. Show toast notification
2. Disable related trading actions
3. Suggest checking connection status in settings

## Testing Checklist

- [ ] Disabled connections don't appear in Active Connections add dialog
- [ ] Enabled but inactive connections appear in add dialog
- [ ] Active connections appear in all Exchange Selection dropdowns
- [ ] Removing from Active Connections removes from Exchange Selection
- [ ] Disabling in Base Settings removes from Active Connections
- [ ] Exchange Selection works across all pages (Live Trading, Analysis, Settings)
