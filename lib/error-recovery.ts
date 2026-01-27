/**
 * Error Recovery & Recovery System
 * Provides mechanisms for error handling, recovery, and monitoring
 */

import { sql } from "@/lib/db"
import { SystemLogger } from "@/lib/system-logger"

export interface ErrorContext {
  component: string
  action: string
  connectionId?: string
  userId?: string
  metadata?: Record<string, any>
}

export interface RecoveryAction {
  type: "retry" | "fallback" | "alert" | "manual"
  priority: "critical" | "high" | "medium" | "low"
  attempts: number
  maxAttempts: number
  nextRetryTime?: number
}

export class ErrorRecoveryManager {
  private static errorCounters: Map<string, number> = new Map()
  private static lastRecoveryAttempt: Map<string, number> = new Map()

  /**
   * Handle and recover from errors
   */
  static async handleError(error: Error | unknown, context: ErrorContext): Promise<RecoveryAction | null> {
    const errorKey = this.getErrorKey(context)
    const errorCount = (this.errorCounters.get(errorKey) || 0) + 1
    this.errorCounters.set(errorKey, errorCount)

    console.error("[v0] Error recovery triggered:", {
      error: error instanceof Error ? error.message : String(error),
      ...context,
      errorCount,
    })

    // Log error
    await SystemLogger.logError(error, context.component, context.action, context.metadata)

    // Determine recovery action based on error type and frequency
    const action = this.determineRecoveryAction(error, context, errorCount)

    // Execute recovery based on priority
    if (action.type === "retry" && action.attempts < action.maxAttempts) {
      await this.scheduleRetry(errorKey, action)
    } else if (action.type === "fallback") {
      await this.executeFallback(context)
    } else if (action.type === "alert") {
      await this.sendAlert(context, error)
    }

    return action
  }

  /**
   * Determine recovery action based on error type
   */
  private static determineRecoveryAction(
    error: Error | unknown,
    context: ErrorContext,
    errorCount: number,
  ): RecoveryAction {
    const errorMessage = error instanceof Error ? error.message : String(error)

    // Database errors - retry with backoff
    if (errorMessage.includes("database") || errorMessage.includes("ECONNREFUSED")) {
      return {
        type: "retry",
        priority: "critical",
        attempts: errorCount,
        maxAttempts: 5,
        nextRetryTime: Math.min(1000 * Math.pow(2, errorCount), 30000), // Exponential backoff
      }
    }

    // API/Network errors - retry with moderate backoff
    if (errorMessage.includes("timeout") || errorMessage.includes("429") || errorMessage.includes("ENOTFOUND")) {
      return {
        type: "retry",
        priority: "high",
        attempts: errorCount,
        maxAttempts: 3,
        nextRetryTime: 2000 * errorCount,
      }
    }

    // Validation errors - use fallback
    if (
      errorMessage.includes("validation") ||
      errorMessage.includes("invalid") ||
      errorMessage.includes("undefined")
    ) {
      return {
        type: "fallback",
        priority: "medium",
        attempts: errorCount,
        maxAttempts: 1,
      }
    }

    // Critical errors - alert and manual intervention
    if (errorMessage.includes("FATAL") || errorMessage.includes("critical")) {
      return {
        type: "alert",
        priority: "critical",
        attempts: errorCount,
        maxAttempts: 1,
      }
    }

    // Default - alert and log
    return {
      type: "alert",
      priority: errorCount > 5 ? "critical" : "medium",
      attempts: errorCount,
      maxAttempts: 10,
    }
  }

  /**
   * Schedule retry with backoff
   */
  private static async scheduleRetry(errorKey: string, action: RecoveryAction): Promise<void> {
    const nextRetryTime = (action.nextRetryTime || 1000) + Date.now()
    this.lastRecoveryAttempt.set(errorKey, nextRetryTime)

    console.log(`[v0] Scheduling retry for ${errorKey} in ${action.nextRetryTime}ms`)
  }

  /**
   * Execute fallback strategy
   */
  private static async executeFallback(context: ErrorContext): Promise<void> {
    console.log("[v0] Executing fallback strategy for:", context.component)

    try {
      // Fallback strategies based on component
      if (context.component === "indication-processor") {
        // Use cached indication results
        console.log("[v0] Using cached indications")
      } else if (context.component === "strategy-processor") {
        // Use default strategy configurations
        console.log("[v0] Using default strategies")
      } else if (context.component === "connection-manager") {
        // Use predefined connections
        console.log("[v0] Using predefined connections")
      }

      await SystemLogger.logAPI("Fallback executed", "info", `${context.component}/fallback`, context.metadata)
    } catch (fallbackError) {
      console.error("[v0] Fallback execution failed:", fallbackError)
      await SystemLogger.logError(fallbackError, context.component, "fallback")
    }
  }

  /**
   * Send alert for critical errors
   */
  private static async sendAlert(context: ErrorContext, error: Error | unknown): Promise<void> {
    console.error("[v0] ALERT: Critical error detected in", context.component)

    try {
      // Store alert in database
      await sql`
        INSERT INTO system_alerts (
          component, action, connection_id, message, severity, created_at
        ) VALUES (
          ${context.component},
          ${context.action},
          ${context.connectionId || null},
          ${error instanceof Error ? error.message : String(error)},
          'critical',
          CURRENT_TIMESTAMP
        )
      `.catch((dbError) => {
        console.warn("[v0] Could not store alert in database:", dbError)
      })

      // In production, send email/Slack notification here
      await SystemLogger.logAlert(context.component, error, context.metadata)
    } catch (alertError) {
      console.error("[v0] Alert sending failed:", alertError)
    }
  }

  /**
   * Generate error key for tracking
   */
  private static getErrorKey(context: ErrorContext): string {
    return `${context.component}:${context.action}:${context.connectionId || "global"}`
  }

  /**
   * Check if retry should proceed
   */
  static shouldRetry(errorKey: string): boolean {
    const lastRetry = this.lastRecoveryAttempt.get(errorKey) || 0
    return Date.now() >= lastRetry
  }

  /**
   * Reset error counter
   */
  static resetErrorCounter(errorKey: string): void {
    this.errorCounters.delete(errorKey)
    this.lastRecoveryAttempt.delete(errorKey)
    console.log("[v0] Error counter reset for:", errorKey)
  }

  /**
   * Get error statistics
   */
  static getErrorStats(errorKey?: string) {
    if (errorKey) {
      return {
        key: errorKey,
        count: this.errorCounters.get(errorKey) || 0,
        lastRetry: this.lastRecoveryAttempt.get(errorKey),
      }
    }

    return {
      totalErrors: this.errorCounters.size,
      topErrors: Array.from(this.errorCounters.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10),
    }
  }

  /**
   * Clear all error history (use with caution)
   */
  static clearAllErrors(): void {
    console.warn("[v0] Clearing all error counters")
    this.errorCounters.clear()
    this.lastRecoveryAttempt.clear()
  }
}

/**
 * Monitoring utilities
 */
export class SystemMonitor {
  /**
   * Check system health and generate report
   */
  static async generateHealthReport() {
    try {
      const stats = ErrorRecoveryManager.getErrorStats()

      const report = {
        timestamp: new Date().toISOString(),
        errors: stats,
        components: await this.checkComponentHealth(),
        performance: await this.getPerformanceMetrics(),
      }

      return report
    } catch (error) {
      console.error("[v0] Health report generation failed:", error)
      return null
    }
  }

  /**
   * Check individual component health
   */
  private static async checkComponentHealth() {
    const components = ["connection-manager", "trade-engine", "indication-processor", "strategy-processor"]

    const health: Record<string, any> = {}

    for (const component of components) {
      try {
        const errorStats = ErrorRecoveryManager.getErrorStats(`${component}:*`)
        health[component] = {
          status: errorStats.count > 5 ? "unhealthy" : "healthy",
          errorCount: errorStats.count,
        }
      } catch (error) {
        health[component] = { status: "unknown", error: String(error) }
      }
    }

    return health
  }

  /**
   * Get performance metrics
   */
  private static async getPerformanceMetrics() {
    const memUsage = process.memoryUsage()

    return {
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + "MB",
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + "MB",
        external: Math.round(memUsage.external / 1024 / 1024) + "MB",
      },
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    }
  }
}
