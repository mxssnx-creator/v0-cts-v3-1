/**
 * Trade Engine Performance Monitor
 * Tracks and optimizes trade engine performance metrics
 */

import { SystemLogger } from "./system-logger"

interface PerformanceMetrics {
  indicationProcessingTime: number[]
  strategyProcessingTime: number[]
  realtimeProcessingTime: number[]
  memoryUsage: number[]
  cpuUsage: number[]
  databaseQueryTime: number[]
  positionUpdateTime: number[]
}

export class TradeEnginePerformanceMonitor {
  private static metrics: PerformanceMetrics = {
    indicationProcessingTime: [],
    strategyProcessingTime: [],
    realtimeProcessingTime: [],
    memoryUsage: [],
    cpuUsage: [],
    databaseQueryTime: [],
    positionUpdateTime: [],
  }

  private static readonly MAX_SAMPLES = 100
  private static warningThresholds = {
    indicationProcessing: 5000, // 5 seconds
    strategyProcessing: 5000,
    realtimeProcessing: 3000,
    memoryUsage: 80, // 80%
    cpuUsage: 80,
    databaseQuery: 1000, // 1 second
  }

  static recordIndicationProcessing(duration: number): void {
    this.recordMetric("indicationProcessingTime", duration)

    if (duration > this.warningThresholds.indicationProcessing) {
      SystemLogger.logSystem(
        `Indication processing slow: ${duration}ms (threshold: ${this.warningThresholds.indicationProcessing}ms)`,
        "warn",
      )
    }
  }

  static recordStrategyProcessing(duration: number): void {
    this.recordMetric("strategyProcessingTime", duration)

    if (duration > this.warningThresholds.strategyProcessing) {
      SystemLogger.logSystem(
        `Strategy processing slow: ${duration}ms (threshold: ${this.warningThresholds.strategyProcessing}ms)`,
        "warn",
      )
    }
  }

  static recordRealtimeProcessing(duration: number): void {
    this.recordMetric("realtimeProcessingTime", duration)

    if (duration > this.warningThresholds.realtimeProcessing) {
      SystemLogger.logSystem(
        `Realtime processing slow: ${duration}ms (threshold: ${this.warningThresholds.realtimeProcessing}ms)`,
        "warn",
      )
    }
  }

  static recordMemoryUsage(usage: number): void {
    this.recordMetric("memoryUsage", usage)

    if (usage > this.warningThresholds.memoryUsage) {
      SystemLogger.logSystem(`High memory usage: ${usage}% (threshold: ${this.warningThresholds.memoryUsage}%)`, "warn")
    }
  }

  static recordDatabaseQuery(duration: number): void {
    this.recordMetric("databaseQueryTime", duration)

    if (duration > this.warningThresholds.databaseQuery) {
      SystemLogger.logSystem(
        `Slow database query: ${duration}ms (threshold: ${this.warningThresholds.databaseQuery}ms)`,
        "warn",
      )
    }
  }

  private static recordMetric(key: keyof PerformanceMetrics, value: number): void {
    this.metrics[key].push(value)

    // Keep only last MAX_SAMPLES
    if (this.metrics[key].length > this.MAX_SAMPLES) {
      this.metrics[key].shift()
    }
  }

  static getAverageMetric(key: keyof PerformanceMetrics): number {
    const values = this.metrics[key]
    if (values.length === 0) return 0
    return values.reduce((a, b) => a + b, 0) / values.length
  }

  static getMetricsSummary(): Record<string, any> {
    return {
      indicationProcessing: {
        avg: this.getAverageMetric("indicationProcessingTime"),
        max: Math.max(...this.metrics.indicationProcessingTime, 0),
        min: Math.min(...this.metrics.indicationProcessingTime, 0),
      },
      strategyProcessing: {
        avg: this.getAverageMetric("strategyProcessingTime"),
        max: Math.max(...this.metrics.strategyProcessingTime, 0),
        min: Math.min(...this.metrics.strategyProcessingTime, 0),
      },
      realtimeProcessing: {
        avg: this.getAverageMetric("realtimeProcessingTime"),
        max: Math.max(...this.metrics.realtimeProcessingTime, 0),
        min: Math.min(...this.metrics.realtimeProcessingTime, 0),
      },
      databaseQuery: {
        avg: this.getAverageMetric("databaseQueryTime"),
        max: Math.max(...this.metrics.databaseQueryTime, 0),
        min: Math.min(...this.metrics.databaseQueryTime, 0),
      },
      memoryUsage: {
        current: this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1] || 0,
        avg: this.getAverageMetric("memoryUsage"),
      },
    }
  }

  static getHealthStatus(): "healthy" | "degraded" | "unhealthy" {
    const avgIndication = this.getAverageMetric("indicationProcessingTime")
    const avgStrategy = this.getAverageMetric("strategyProcessingTime")
    const avgRealtime = this.getAverageMetric("realtimeProcessingTime")
    const memUsage = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1] || 0

    const unhealthyCount = [
      avgIndication > this.warningThresholds.indicationProcessing * 2,
      avgStrategy > this.warningThresholds.strategyProcessing * 2,
      avgRealtime > this.warningThresholds.realtimeProcessing * 2,
      memUsage > 90,
    ].filter(Boolean).length

    const degradedCount = [
      avgIndication > this.warningThresholds.indicationProcessing,
      avgStrategy > this.warningThresholds.strategyProcessing,
      avgRealtime > this.warningThresholds.realtimeProcessing,
      memUsage > 80,
    ].filter(Boolean).length

    if (unhealthyCount > 0) return "unhealthy"
    if (degradedCount > 0) return "degraded"
    return "healthy"
  }
}
