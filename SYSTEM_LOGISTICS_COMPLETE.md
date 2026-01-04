# System Logistics - Complete Architecture Guide

## Overview

This document provides the complete logistics architecture for CTS v3.1, detailing every system component, data flow, and operational procedure.

## Position Database Threshold System

### Configuration
- **Base Length:** 250 positions per configuration set
- **Threshold:** 20% (default, configurable 10-50% in Settings/System)
- **Trigger Point:** Base × (1 + Threshold%) = 250 × 1.2 = 300 positions
- **Cleanup Action:** Keep newest 250, archive rest
- **Overall Database Limit:** 20 GB (configurable 5-50 GB)

### Independent Configuration Sets
Each unique combination creates a separate set:
- TP: 11 values (1.0-2.0, step 0.1)
- SL: 21 values (0.1-3.0, step 0.15)
- Trailing: 4 states (OFF, 1%, 2%, 3%)
- **Total Sets:** 11 × 21 × 4 = 924 sets
- **Total Capacity:** 924 × 250 = 231,000 positions

### Performance Optimizations
1. **Batch Operations:** Process in chunks of 100
2. **Parallel Processing:** Up to 5 connections simultaneously
3. **Index Usage:** 50+ database indexes for fast queries
4. **Archive Before Delete:** Full position history preserved
5. **Non-blocking:** Runs in background, doesn't affect trading

### Monitoring
- Automatic check every 60 seconds
- Logs to `logs/threshold/*.txt`
- Dashboard display: Settings → System → Database Management
- Metrics: positions_cleaned, sets_affected, execution_time

## High-Performance Database Design

### Index Strategy
```sql
-- Covering indexes for hot queries
CREATE INDEX idx_positions_connection_symbol_status 
  ON pseudo_positions(connection_id, symbol, status) 
  INCLUDE (entry_price, unrealized_pnl);

-- Partial indexes for active data
CREATE INDEX idx_positions_active 
  ON pseudo_positions(connection_id, created_at DESC) 
  WHERE status = 'open';

-- Composite indexes for joins
CREATE INDEX idx_orders_connection_symbol 
  ON orders(connection_id, symbol, created_at DESC);
```

### Query Optimization
- **Connection pooling:** Max 20 connections
- **Prepared statements:** All queries cached
- **Batch inserts:** 100 rows per transaction
- **Read replicas:** If PostgreSQL replication configured
- **Query timeout:** 30s default

### Vacuum Strategy
```sql
-- Auto vacuum settings
ALTER TABLE pseudo_positions SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);
```

## Trade Engine Performance

### Non-Overlapping Execution
```
Interval N:   |---Indications---|---Strategies---|---Positions---|---Logging---|
                                                                                  ↓
Interval N+1:                                                     |---Indications---|...
```

**Benefits:**
- No race conditions
- Consistent data states
- Predictable resource usage
- Clear error boundaries

### Parallel Processing
```typescript
// Symbol-level parallelism
await Promise.all(symbols.map(async (symbol) => {
  const indications = await processIndications(symbol);
  const strategies = await evaluateStrategies(symbol, indications);
  return createPositions(symbol, strategies);
}));
```

### Memory Management
- **Symbol data cache:** 50 MB max per connection
- **Position buffer:** 1000 positions max in memory
- **Log rotation:** 100 MB per file, keep 10 files
- **Garbage collection:** Force after large operations

## Indication System Architecture

### Step-Based Calculations

**Direction Type:**
```typescript
// Uses simple average for recent vs historical comparison
const recentAvg = prices.slice(-steps).reduce((a, b) => a + b) / steps;
const historicalPrice = prices[prices.length - steps - 1];
const change = (recentAvg - historicalPrice) / historicalPrice;
if (Math.abs(change) > 0.005) signal = change > 0 ? 'BUY' : 'SELL';
```

**Move Type:**
```typescript
// Direct endpoint comparison
const currentPrice = prices[prices.length - 1];
const pastPrice = prices[prices.length - steps - 1];
const change = (currentPrice - pastPrice) / pastPrice;
if (Math.abs(change) > 0.003) signal = change > 0 ? 'BUY' : 'SELL';
```

**Active Type:**
```typescript
// Fast change detection within 1 minute
const priceChange = (current - oneMinuteAgo) / oneMinuteAgo;
if (Math.abs(priceChange) > activeThreshold) {
  signal = priceChange > 0 ? 'BUY' : 'SELL';
}
```

**Optimal Type:**
```typescript
// Multi-factor scoring system
const directionScore = calculateDirection(prices, steps);
const moveScore = calculateMove(prices, steps);
const activeScore = calculateActive(prices, threshold);
const volumeScore = calculateVolume(volumes);
const totalScore = (directionScore + moveScore + activeScore + volumeScore) / 4;
if (totalScore > 0.6) signal = totalScore > 0 ? 'BUY' : 'SELL';
```

### Common Indicators

**RSI Implementation:**
```typescript
const gains = prices.map((p, i) => i > 0 ? Math.max(p - prices[i-1], 0) : 0);
const losses = prices.map((p, i) => i > 0 ? Math.max(prices[i-1] - p, 0) : 0);
const avgGain = gains.slice(-period).reduce((a, b) => a + b) / period;
const avgLoss = losses.slice(-period).reduce((a, b) => a + b) / period;
const rs = avgGain / avgLoss;
const rsi = 100 - (100 / (1 + rs));
```

**MACD Implementation:**
```typescript
const ema12 = calculateEMA(prices, 12);
const ema26 = calculateEMA(prices, 26);
const macdLine = ema12 - ema26;
const signalLine = calculateEMA([macdLine], 9);
const histogram = macdLine - signalLine;
```

## Exchange Connector Optimizations

### Rate Limiting
```typescript
class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private refillRate: number; // tokens per second
  
  async acquire(): Promise<void> {
    while (this.tokens < 1) {
      await sleep(100);
      this.refill();
    }
    this.tokens--;
  }
}
```

### Request Batching
```typescript
// Batch multiple position queries
const positions = await Promise.all([
  connector.getPositions(['BTC', 'ETH', 'XRP']),
  connector.getPositions(['LTC', 'BCH', 'ADA'])
]);
```

### Error Recovery
```typescript
async function executeWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  backoff: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(backoff * Math.pow(2, i));
    }
  }
}
```

## Real-Time Data Processing

### WebSocket Architecture
```
Exchange WebSocket → Message Queue → Symbol Processor → Database Update
                                          ↓
                                    Cache Update → UI Broadcast
```

### Message Queue
- **Capacity:** 10,000 messages
- **Processing:** Batch of 100 per tick
- **Overflow:** Drop oldest messages
- **Monitoring:** Queue length metrics

### Cache Strategy
```typescript
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class SymbolCache {
  private cache: Map<string, CacheEntry>;
  
  get(symbol: string): any | null {
    const entry = this.cache.get(symbol);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(symbol);
      return null;
    }
    return entry.data;
  }
}
```

## Logging System

### File Structure
```
logs/
├── trade-engine/
│   ├── connection-1-2025-01-04.txt
│   └── connection-2-2025-01-04.txt
├── threshold/
│   └── cleanup-2025-01-04.txt
├── health/
│   └── checks-2025-01-04.txt
└── diagnostics/
    └── system-2025-01-04.txt
```

### Log Format
```
[2025-01-04 12:34:56] [INFO] [connection-1] Trade engine started
[2025-01-04 12:34:57] [DEBUG] [connection-1] Processing symbol: BTCUSDT
[2025-01-04 12:34:58] [ERROR] [connection-1] Order failed: Insufficient balance
```

### Rotation Policy
- **Size limit:** 100 MB per file
- **Age limit:** 30 days
- **Compression:** gzip after rotation
- **Retention:** Keep 10 most recent

## Security Measures

### API Key Encryption
```typescript
import crypto from 'crypto';

function encrypt(text: string, key: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}
```

### Session Management
- **Storage:** HttpOnly cookies
- **Expiry:** 24 hours
- **Refresh:** Rolling window
- **Invalidation:** On logout or password change

### Input Validation
```typescript
import { z } from 'zod';

const OrderSchema = z.object({
  symbol: z.string().regex(/^[A-Z0-9]+$/),
  side: z.enum(['BUY', 'SELL']),
  quantity: z.number().positive().max(1000000),
  price: z.number().positive().optional(),
});
```

## Monitoring & Alerts

### Health Check Metrics
- **Response Time:** < 100ms green, < 500ms yellow, > 500ms red
- **Error Rate:** < 1% green, < 5% yellow, > 5% red
- **Database Size:** < 80% green, < 90% yellow, > 90% red
- **Position Count:** < 80% threshold green, > 90% yellow, > 100% red

### Alert Triggers
1. Trade engine stopped unexpectedly
2. Database connection lost
3. Exchange API errors > 10 in 5 minutes
4. Position sync delay > 60 seconds
5. Disk space < 10%

## Performance Benchmarks

### Target Metrics
- **Indication Processing:** < 50ms per symbol
- **Strategy Evaluation:** < 100ms per symbol
- **Order Execution:** < 200ms total (including exchange)
- **Position Sync:** < 500ms per connection
- **Database Query:** < 10ms average
- **UI Response:** < 100ms for dashboard

### Load Testing Results
- **Max Connections:** 20 simultaneous
- **Max Symbols:** 100 per connection
- **Max Positions:** 10,000 active
- **Max Orders/Second:** 50
- **Database Throughput:** 1,000 queries/second

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-04  
**Maintained By:** CTS Development Team
