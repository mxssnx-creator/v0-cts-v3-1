# Exchange API Rate Limits

This document outlines the accurate rate limits for each exchange based on official 2024 documentation.

## Rate Limit Strategy

All rate limits are set **conservatively** (20-30% below official limits) to ensure:
- No accidental rate limit violations
- Room for burst traffic
- Account for network latency and processing delays
- Protection against bans and penalties

## Exchange Rate Limits

### Bybit (Unified Trading)
**Official Limits:**
- Trade endpoints: 10 req/s
- Query endpoints: 50 req/s  
- IP limit: 600 req per 5 seconds

**Our Conservative Limits:**
- 8 requests per second
- 400 requests per minute
- 5 concurrent requests max

**Source:** https://bybit-exchange.github.io/docs/v5/rate-limit

---

### BingX (Perpetual Futures)
**Official Limits:**
- Order placement: 10 req/s (600 req/min)
- Account interfaces: 2000 req per 10s (12,000 req/min)

**Our Conservative Limits:**
- 8 requests per second
- 450 requests per minute
- 5 concurrent requests max

**Source:** https://bingx.com/en/support/articles/31103871611289

---

### Pionex (Perpetual Futures)
**Official Limits:**
- All endpoints: 10 req/s per IP
- Private endpoints: 10 req/s per account
- Weight-based system applies

**Our Conservative Limits:**
- 8 requests per second
- 400 requests per minute
- 5 concurrent requests max

**Source:** https://pionex-doc.gitbook.io/apidocs/restful/general/rate-limit

---

### OrangeX (Perpetual Futures)
**Official Limits:**
- No official documentation found

**Our Conservative Limits:**
- 5 requests per second
- 250 requests per minute
- 3 concurrent requests max

**Note:** Very conservative due to lack of official documentation

---

### Binance (USDT-M Futures)
**Official Limits:**
- 1200 request weight per minute
- Weight varies by endpoint (1-50)

**Our Conservative Limits:**
- 15 requests per second
- 900 requests per minute
- 10 concurrent requests max

---

### OKX (Perpetual Swap)
**Official Limits:**
- 20 req/s documented

**Our Conservative Limits:**
- 15 requests per second
- 800 requests per minute
- 10 concurrent requests max

---

### Other Exchanges
All other supported exchanges (Gate.io, KuCoin, MEXC, Bitget, Huobi) use conservative default limits:
- 8-10 requests per second
- 400-500 requests per minute
- 5-8 concurrent requests max

## Rate Limiter Implementation

The `RateLimiter` class (`lib/rate-limiter.ts`) implements:

1. **Per-second limiting** - Tracks requests in last 1 second
2. **Per-minute limiting** - Tracks requests in last 60 seconds
3. **Concurrent limiting** - Maximum simultaneous requests
4. **Intelligent queuing** - Automatically queues and retries
5. **Rolling windows** - Uses precise timestamp tracking

## Usage

```typescript
import { getRateLimiter } from '@/lib/rate-limiter'

const limiter = getRateLimiter('bybit')
const result = await limiter.execute(async () => {
  return await fetch('https://api.bybit.com/...')
})
```

## Monitoring

Check rate limiter stats:
```typescript
const stats = limiter.getStats()
// Returns: queueLength, activeRequests, requestsLastSecond, requestsLastMinute
```

## Important Notes

1. **Never modify these limits upward** without confirming with official exchange documentation
2. **Weight-based systems** (Binance, Pionex) may use more than 1 request weight per call
3. **Burst protection** - Our limits allow for temporary spikes without hitting exchange limits
4. **Ban prevention** - Conservative limits prevent temporary or permanent API key bans
5. **Multiple connections** - If using multiple API keys for same exchange, limits apply per key

## Last Updated
January 2025 - Based on official exchange documentation
