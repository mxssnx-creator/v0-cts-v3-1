/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures by stopping requests to failing services
 */

export type CircuitState = "closed" | "open" | "half-open"

export interface CircuitBreakerConfig {
  failureThreshold: number // Number of failures before opening
  resetTimeout: number // Milliseconds before attempting to close
  monitorInterval: number // Milliseconds between health checks
  name: string
}

interface CircuitBreakerMetrics {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  lastFailureTime: number | null
  stateChanges: Array<{ state: CircuitState; timestamp: number }>
}

export class CircuitBreaker {
  private state: CircuitState = "closed"
  private failureCount = 0
  private lastFailureTime: number | null = null
  private metrics: CircuitBreakerMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    lastFailureTime: null,
    stateChanges: [{ state: "closed", timestamp: Date.now() }],
  }

  constructor(private config: CircuitBreakerConfig) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    this.metrics.totalRequests++

    if (this.state === "open") {
      if (Date.now() - (this.lastFailureTime || 0) > this.config.resetTimeout) {
        this.setState("half-open")
        console.log(`[v0] Circuit breaker ${this.config.name} entering half-open state`)
      } else {
        throw new Error(`Circuit breaker ${this.config.name} is OPEN`)
      }
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess(): void {
    this.metrics.successfulRequests++
    this.failureCount = 0

    if (this.state === "half-open") {
      this.setState("closed")
      console.log(`[v0] Circuit breaker ${this.config.name} closing - recovered`)
    }
  }

  private onFailure(): void {
    this.metrics.failedRequests++
    this.lastFailureTime = Date.now()
    this.metrics.lastFailureTime = this.lastFailureTime
    this.failureCount++

    if (this.failureCount >= this.config.failureThreshold) {
      this.setState("open")
      console.warn(
        `[v0] Circuit breaker ${this.config.name} opening after ${this.failureCount} failures`
      )
    }
  }

  private setState(newState: CircuitState): void {
    if (this.state !== newState) {
      this.state = newState
      this.metrics.stateChanges.push({ state: newState, timestamp: Date.now() })
      console.log(`[v0] Circuit breaker ${this.config.name} state changed: ${newState}`)
    }
  }

  getMetrics() {
    return {
      ...this.metrics,
      state: this.state,
      failureCount: this.failureCount,
      successRate: this.metrics.totalRequests > 0 
        ? (this.metrics.successfulRequests / this.metrics.totalRequests) * 100 
        : 0,
    }
  }

  reset(): void {
    this.failureCount = 0
    this.lastFailureTime = null
    this.setState("closed")
    console.log(`[v0] Circuit breaker ${this.config.name} manually reset`)
  }

  getState(): CircuitState {
    return this.state
  }
}

// Global registry of circuit breakers
const circuitBreakers = new Map<string, CircuitBreaker>()

export function getOrCreateCircuitBreaker(config: CircuitBreakerConfig): CircuitBreaker {
  if (!circuitBreakers.has(config.name)) {
    circuitBreakers.set(config.name, new CircuitBreaker(config))
  }
  return circuitBreakers.get(config.name)!
}

export function getAllCircuitBreakerMetrics() {
  const metrics: Record<string, any> = {}
  circuitBreakers.forEach((breaker, name) => {
    metrics[name] = breaker.getMetrics()
  })
  return metrics
}
