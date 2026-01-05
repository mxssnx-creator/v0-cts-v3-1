/**
 * Database Configuration Manager
 * Handles project-specific database naming and prefixing
 * Integrated with DatabasePrefixManager for installation-time configuration
 */

import { readFileSync, existsSync, writeFileSync } from "fs"
import path from "path"

interface DatabaseConfig {
  projectName: string
  dbPrefix: string
  databases: {
    main: string
    indicationActive: string
    indicationDirection: string
    indicationMove: string
    strategySimple: string
    strategyAdvanced: string
    strategyStep: string
  }
  users: {
    admin: string
    app: string
  }
}

class DatabaseConfigManager {
  private static instance: DatabaseConfigManager
  private config: DatabaseConfig | null = null
  private configPath: string

  private constructor() {
    this.configPath = this.findConfigPath()
    this.loadConfig()
  }

  public static getInstance(): DatabaseConfigManager {
    if (!DatabaseConfigManager.instance) {
      DatabaseConfigManager.instance = new DatabaseConfigManager()
    }
    return DatabaseConfigManager.instance
  }

  private findConfigPath(): string {
    const possiblePaths = [
      path.join(process.cwd(), "db-config.json"),
      path.join(process.cwd(), "data", "db-config.json"),
      path.join(process.cwd(), "data", "db-prefix-config.json"),
    ]

    for (const configPath of possiblePaths) {
      if (existsSync(configPath)) {
        return configPath
      }
    }

    // Return default path
    return path.join(process.cwd(), "data", "db-config.json")
  }

  private loadConfig(): void {
    try {
      if (existsSync(this.configPath)) {
        const configData = JSON.parse(readFileSync(this.configPath, "utf-8"))

        // Support both old and new config formats
        if (configData.prefix && !configData.dbPrefix) {
          // New format from DatabasePrefixManager
          this.config = this.createConfigFromPrefix(configData.prefix, configData.projectName)
        } else {
          // Old format
          this.config = configData
        }

        console.log(`[DatabaseConfig] Loaded configuration for project: ${this.config.projectName}`)
        return
      }

      const projectName = process.env.PROJECT_NAME || "CTS v3.1"
      const dbPrefix = this.sanitizePrefix(projectName)

      this.config = this.createConfigFromPrefix(dbPrefix, projectName)
      this.saveConfig()

      console.log(`[DatabaseConfig] Using default configuration with prefix: ${dbPrefix}`)
    } catch (error) {
      console.error("[DatabaseConfig] Failed to load configuration:", error)
      throw error
    }
  }

  private createConfigFromPrefix(prefix: string, projectName: string): DatabaseConfig {
    // Ensure prefix ends with underscore
    const normalizedPrefix = prefix.endsWith("_") ? prefix.slice(0, -1) : prefix

    return {
      projectName,
      dbPrefix: normalizedPrefix,
      databases: {
        main: `${normalizedPrefix}_main`,
        indicationActive: `${normalizedPrefix}_indication_active`,
        indicationDirection: `${normalizedPrefix}_indication_direction`,
        indicationMove: `${normalizedPrefix}_indication_move`,
        strategySimple: `${normalizedPrefix}_strategy_simple`,
        strategyAdvanced: `${normalizedPrefix}_strategy_advanced`,
        strategyStep: `${normalizedPrefix}_strategy_step`,
      },
      users: {
        admin: `${normalizedPrefix}_admin`,
        app: `${normalizedPrefix}_app`,
      },
    }
  }

  private sanitizePrefix(projectName: string): string {
    return projectName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "")
  }

  private saveConfig(): void {
    try {
      const dir = path.dirname(this.configPath)
      if (!existsSync(dir)) {
        const { mkdirSync } = require("fs")
        mkdirSync(dir, { recursive: true })
      }

      writeFileSync(this.configPath, JSON.stringify(this.config, null, 2))
      console.log(`[DatabaseConfig] Configuration saved to ${this.configPath}`)
    } catch (error) {
      console.error("[DatabaseConfig] Failed to save configuration:", error)
    }
  }

  public getConfig(): DatabaseConfig {
    if (!this.config) {
      throw new Error("Database configuration not loaded")
    }
    return this.config
  }

  public getTableName(baseTableName: string): string {
    if (!this.config) {
      throw new Error("Database configuration not loaded")
    }
    return `${this.config.dbPrefix}_${baseTableName}`
  }

  public getMainDatabase(): string {
    return this.config?.databases.main || "cts_v3_1_main"
  }

  public getIndicationDatabase(type: "active" | "direction" | "move"): string {
    if (!this.config) {
      throw new Error("Database configuration not loaded")
    }

    switch (type) {
      case "active":
        return this.config.databases.indicationActive
      case "direction":
        return this.config.databases.indicationDirection
      case "move":
        return this.config.databases.indicationMove
      default:
        throw new Error(`Invalid indication type: ${type}`)
    }
  }

  public getStrategyDatabase(type: "simple" | "advanced" | "step"): string {
    if (!this.config) {
      throw new Error("Database configuration not loaded")
    }

    switch (type) {
      case "simple":
        return this.config.databases.strategySimple
      case "advanced":
        return this.config.databases.strategyAdvanced
      case "step":
        return this.config.databases.strategyStep
      default:
        throw new Error(`Invalid strategy type: ${type}`)
    }
  }

  public getAdminUser(): string {
    return this.config?.users.admin || "cts_v3_1_admin"
  }

  public getAppUser(): string {
    return this.config?.users.app || "cts_v3_1_app"
  }

  public updateProjectName(projectName: string): void {
    const newPrefix = this.sanitizePrefix(projectName)
    this.config = this.createConfigFromPrefix(newPrefix, projectName)
    this.saveConfig()
  }

  public getPrefix(): string {
    return this.config?.dbPrefix || "cts_v3_1"
  }
}

export const dbConfig = DatabaseConfigManager.getInstance()
export type { DatabaseConfig }
