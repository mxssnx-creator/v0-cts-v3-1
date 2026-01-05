/**
 * System Integrity Checker
 * Comprehensive validation of all system components
 */

import { DatabaseManager } from "./database"
import { GlobalTradeEngineCoordinator } from "./global-trade-engine-coordinator"
import { getExchangeConnector } from "./exchange-connectors"
import { getDatabaseType } from "./db"
import type { ExchangeConnection } from "./types"

export interface IntegrityCheckResult {
  passed: boolean
  component: string
  message: string
  severity: "info" | "warning" | "error"
  timestamp: Date
}

export interface SystemIntegrityReport {
  overallStatus: "healthy" | "warnings" | "critical"
  totalChecks: number
  passed: number
  warnings: number
  errors: number
  checks: IntegrityCheckResult[]
  timestamp: Date
}

export class SystemIntegrityChecker {
  private static instance: SystemIntegrityChecker | null = null
  private db: DatabaseManager
  private coordinator: GlobalTradeEngineCoordinator

  private constructor() {
    this.db = DatabaseManager.getInstance()
    this.coordinator = GlobalTradeEngineCoordinator.getInstance()
  }

  public static getInstance(): SystemIntegrityChecker {
    if (!SystemIntegrityChecker.instance) {
      SystemIntegrityChecker.instance = new SystemIntegrityChecker()
    }
    return SystemIntegrityChecker.instance
  }

  /**
   * Run comprehensive system integrity check
   */
  public async runFullCheck(): Promise<SystemIntegrityReport> {
    console.log("[v0] Starting comprehensive system integrity check...")
    const checks: IntegrityCheckResult[] = []
    const timestamp = new Date()

    // 1. Database Connectivity Check
    checks.push(...(await this.checkDatabaseConnectivity()))

    // 2. Database Schema Integrity
    checks.push(...(await this.checkDatabaseSchema()))

    // 3. Exchange Connections Check
    checks.push(...(await this.checkExchangeConnections()))

    // 4. Trade Engine Health Check
    checks.push(...(await this.checkTradeEngineHealth()))

    // 5. High-Performance Router Check
    checks.push(...(await this.checkHighPerformanceRouter()))

    // 6. File Storage Check
    checks.push(...(await this.checkFileStorage()))

    // 7. Configuration Validation
    checks.push(...(await this.checkConfiguration()))

    // Calculate statistics
    const passed = checks.filter((c) => c.passed).length
    const warnings = checks.filter((c) => !c.passed && c.severity === "warning").length
    const errors = checks.filter((c) => !c.passed && c.severity === "error").length

    let overallStatus: "healthy" | "warnings" | "critical" = "healthy"
    if (errors > 0) overallStatus = "critical"
    else if (warnings > 0) overallStatus = "warnings"

    const report: SystemIntegrityReport = {
      overallStatus,
      totalChecks: checks.length,
      passed,
      warnings,
      errors,
      checks,
      timestamp,
    }

    console.log(`[v0] System integrity check complete: ${overallStatus}`)
    console.log(`[v0] Passed: ${passed}/${checks.length}, Warnings: ${warnings}, Errors: ${errors}`)

    return report
  }

  /**
   * Check database connectivity
   */
  private async checkDatabaseConnectivity(): Promise<IntegrityCheckResult[]> {
    const checks: IntegrityCheckResult[] = []

    try {
      const dbType = getDatabaseType()
      checks.push({
        passed: true,
        component: "Database",
        message: `Database type: ${dbType}`,
        severity: "info",
        timestamp: new Date(),
      })

      // Test basic query
      const connections = await this.db.getConnections()
      checks.push({
        passed: true,
        component: "Database",
        message: `Database connectivity verified (${connections.length} connections found)`,
        severity: "info",
        timestamp: new Date(),
      })
    } catch (error) {
      checks.push({
        passed: false,
        component: "Database",
        message: `Database connectivity failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        severity: "error",
        timestamp: new Date(),
      })
    }

    return checks
  }

  /**
   * Check database schema integrity
   */
  private async checkDatabaseSchema(): Promise<IntegrityCheckResult[]> {
    const checks: IntegrityCheckResult[] = []

    const requiredEntities = [
      { type: "connection", name: "exchange_connections" },
      { type: "pseudo_position", name: "pseudo_positions" },
      { type: "real_position", name: "real_positions" },
      { type: "preset", name: "presets" },
      { type: "preset_type", name: "preset_types" },
      { type: "log", name: "system_logs" },
    ] as const

    for (const entity of requiredEntities) {
      try {
        await this.db.query(entity.type as any, { limit: 1 })
        checks.push({
          passed: true,
          component: "Database Schema",
          message: `Table '${entity.name}' exists and accessible`,
          severity: "info",
          timestamp: new Date(),
        })
      } catch (error) {
        checks.push({
          passed: false,
          component: "Database Schema",
          message: `Table '${entity.name}' missing or inaccessible`,
          severity: "error",
          timestamp: new Date(),
        })
      }
    }

    return checks
  }

  /**
   * Check exchange connections
   */
  private async checkExchangeConnections(): Promise<IntegrityCheckResult[]> {
    const checks: IntegrityCheckResult[] = []

    try {
      const connections = (await this.db.getConnections()) as ExchangeConnection[]

      if (connections.length === 0) {
        checks.push({
          passed: true,
          component: "Exchange Connections",
          message: "No exchange connections configured",
          severity: "warning",
          timestamp: new Date(),
        })
        return checks
      }

      for (const connection of connections) {
        try {
          // Validate connection structure
          if (!connection.api_key || !connection.api_secret) {
            checks.push({
              passed: false,
              component: "Exchange Connections",
              message: `Connection '${connection.name}' missing API credentials`,
              severity: "error",
              timestamp: new Date(),
            })
            continue
          }

          // Check if connector can be created
          const connector = getExchangeConnector(connection)
          checks.push({
            passed: true,
            component: "Exchange Connections",
            message: `Connection '${connection.name}' (${connection.exchange}) validated`,
            severity: "info",
            timestamp: new Date(),
          })
        } catch (error) {
          checks.push({
            passed: false,
            component: "Exchange Connections",
            message: `Connection '${connection.name}' validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            severity: "error",
            timestamp: new Date(),
          })
        }
      }
    } catch (error) {
      checks.push({
        passed: false,
        component: "Exchange Connections",
        message: `Failed to retrieve connections: ${error instanceof Error ? error.message : "Unknown error"}`,
        severity: "error",
        timestamp: new Date(),
      })
    }

    return checks
  }

  /**
   * Check trade engine health
   */
  private async checkTradeEngineHealth(): Promise<IntegrityCheckResult[]> {
    const checks: IntegrityCheckResult[] = []

    try {
      const health = await this.coordinator.getHealthStatus()

      checks.push({
        passed: health.overall === "healthy",
        component: "Trade Engine",
        message: `Overall health: ${health.overall}`,
        severity: health.overall === "healthy" ? "info" : health.overall === "degraded" ? "warning" : "error",
        timestamp: new Date(),
      })

      // Check individual engines
      const engines = this.coordinator.getEngines()
      checks.push({
        passed: true,
        component: "Trade Engine",
        message: `${engines.size} engine(s) registered`,
        severity: "info",
        timestamp: new Date(),
      })

      // Check if paused
      if (this.coordinator.isPausedState()) {
        checks.push({
          passed: true,
          component: "Trade Engine",
          message: "System is paused",
          severity: "warning",
          timestamp: new Date(),
        })
      }
    } catch (error) {
      checks.push({
        passed: false,
        component: "Trade Engine",
        message: `Health check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        severity: "error",
        timestamp: new Date(),
      })
    }

    return checks
  }

  /**
   * Check high-performance database router
   */
  private async checkHighPerformanceRouter(): Promise<IntegrityCheckResult[]> {
    const checks: IntegrityCheckResult[] = []

    try {
      // Check if HP router tables exist
      const indicationTypes = ["active", "direction", "move"]
      const strategyTypes = ["simple", "advanced", "step"]

      for (const indication of indicationTypes) {
        try {
          await this.db.query(`pseudo_positions_${indication}` as any, { limit: 1 })
          checks.push({
            passed: true,
            component: "High-Performance Router",
            message: `Indication table '${indication}' accessible`,
            severity: "info",
            timestamp: new Date(),
          })
        } catch (error) {
          checks.push({
            passed: false,
            component: "High-Performance Router",
            message: `Indication table '${indication}' not found`,
            severity: "warning",
            timestamp: new Date(),
          })
        }
      }

      for (const strategy of strategyTypes) {
        try {
          await this.db.query(`real_positions_${strategy}` as any, { limit: 1 })
          checks.push({
            passed: true,
            component: "High-Performance Router",
            message: `Strategy table '${strategy}' accessible`,
            severity: "info",
            timestamp: new Date(),
          })
        } catch (error) {
          checks.push({
            passed: false,
            component: "High-Performance Router",
            message: `Strategy table '${strategy}' not found`,
            severity: "warning",
            timestamp: new Date(),
          })
        }
      }
    } catch (error) {
      checks.push({
        passed: false,
        component: "High-Performance Router",
        message: `Router check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        severity: "error",
        timestamp: new Date(),
      })
    }

    return checks
  }

  /**
   * Check file storage system
   */
  private async checkFileStorage(): Promise<IntegrityCheckResult[]> {
    const checks: IntegrityCheckResult[] = []

    try {
      const { loadSettings } = await import("./file-storage")
      const settings = await loadSettings()

      checks.push({
        passed: true,
        component: "File Storage",
        message: "Settings file accessible",
        severity: "info",
        timestamp: new Date(),
      })

      // Check critical settings
      if (!settings.sessionSecret || !settings.jwtSecret) {
        checks.push({
          passed: false,
          component: "File Storage",
          message: "Critical security settings missing",
          severity: "error",
          timestamp: new Date(),
        })
      }
    } catch (error) {
      checks.push({
        passed: false,
        component: "File Storage",
        message: `File storage check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        severity: "error",
        timestamp: new Date(),
      })
    }

    return checks
  }

  /**
   * Check configuration validity
   */
  private async checkConfiguration(): Promise<IntegrityCheckResult[]> {
    const checks: IntegrityCheckResult[] = []

    // Check environment variables
    const requiredEnvVars = ["DATABASE_URL", "SESSION_SECRET", "JWT_SECRET"]

    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        checks.push({
          passed: true,
          component: "Configuration",
          message: `Environment variable '${envVar}' set`,
          severity: "info",
          timestamp: new Date(),
        })
      } else {
        checks.push({
          passed: false,
          component: "Configuration",
          message: `Environment variable '${envVar}' missing`,
          severity: "warning",
          timestamp: new Date(),
        })
      }
    }

    return checks
  }

  /**
   * Quick health check (lightweight)
   */
  public async quickHealthCheck(): Promise<{ healthy: boolean; issues: string[] }> {
    const issues: string[] = []

    try {
      // Database check
      await this.db.getConnections()
    } catch (error) {
      issues.push("Database connectivity issue")
    }

    try {
      // Engine check
      const health = await this.coordinator.getHealthStatus()
      if (health.overall !== "healthy") {
        issues.push(`Trade engine health: ${health.overall}`)
      }
    } catch (error) {
      issues.push("Trade engine check failed")
    }

    return {
      healthy: issues.length === 0,
      issues,
    }
  }
}

// Export singleton getter
export function getSystemIntegrityChecker(): SystemIntegrityChecker {
  return SystemIntegrityChecker.getInstance()
}
