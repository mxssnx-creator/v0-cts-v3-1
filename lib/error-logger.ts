import { execute, getDatabaseType } from "@/lib/db"

interface ErrorLogOptions {
  category?: string
  userId?: string
  connectionId?: string
  metadata?: Record<string, any>
  severity?: "low" | "medium" | "high" | "critical"
}

export class ErrorLogger {
  /**
   * Log an error to both console and database for tracking
   */
  static async logError(error: Error | unknown, context: string, options: ErrorLogOptions = {}): Promise<void> {
    const { category = "API", userId, connectionId, metadata = {}, severity = "medium" } = options

    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined

    console.error(`[v0] Error in ${context}:`, {
      message: errorMessage,
      category,
      severity,
      stack: errorStack,
      metadata,
    })

    try {
      // Don't include timestamp - let database use DEFAULT value
      await execute(
        `INSERT INTO site_logs (
          level, category, message, context,
          user_id, connection_id, error_message, error_stack, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "error",
          category,
          `${context}: ${errorMessage}`,
          context,
          userId || null,
          connectionId || null,
          errorMessage,
          errorStack || null,
          JSON.stringify({
            ...metadata,
            severity,
            timestamp: new Date().toISOString(),
          }),
        ],
      )
    } catch (logError) {
      console.error("[v0] Failed to log error to database:", logError)
    }
  }

  /**
   * Log an info message for tracking important events
   */
  static async logInfo(message: string, context: string, metadata: Record<string, any> = {}): Promise<void> {
    console.log(`[v0] Info in ${context}:`, message, metadata)

    try {
      // Don't include timestamp - let database use DEFAULT value
      await execute(
        `INSERT INTO site_logs (
          level, category, message, context, 
          user_id, connection_id, error_message, error_stack, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "info",
          "system",
          `${context}: ${message}`,
          context,
          null, // user_id
          null, // connection_id
          null, // error_message
          null, // error_stack
          JSON.stringify({
            ...metadata,
            timestamp: new Date().toISOString(),
          }),
        ],
      )
    } catch (logError) {
      console.error("[v0] Failed to log info to database:", logError)
    }
  }

  /**
   * Log a warning for potential issues
   */
  static async logWarning(message: string, context: string, metadata: Record<string, any> = {}): Promise<void> {
    console.warn(`[v0] Warning in ${context}:`, message, metadata)

    try {
      const dbType = getDatabaseType()
      const isPostgreSQL = dbType === "postgresql"

      if (isPostgreSQL) {
        await execute(
          `INSERT INTO site_logs (
            timestamp, level, category, message, context, metadata
          ) VALUES (NOW(), $1, $2, $3, $4, $5)`,
          [
            "warn",
            "system",
            `${context}: ${message}`,
            context,
            JSON.stringify({
              ...metadata,
              timestamp: new Date().toISOString(),
            }),
          ],
        )
      } else {
        await execute(
          `INSERT INTO site_logs (
            timestamp, level, category, message, context, metadata
          ) VALUES (datetime('now'), ?, ?, ?, ?, ?)`,
          [
            "warn",
            "system",
            `${context}: ${message}`,
            context,
            JSON.stringify({
              ...metadata,
              timestamp: new Date().toISOString(),
            }),
          ],
        )
      }
    } catch (logError) {
      console.error("[v0] Failed to log warning to database:", logError)
    }
  }

  /**
   * Log a debug message for development tracking
   */
  static async logDebug(message: string, context: string, metadata: Record<string, any> = {}): Promise<void> {
    if (process.env.NODE_ENV === "development") {
      console.debug(`[v0] Debug in ${context}:`, message, metadata)
    }

    try {
      const dbType = getDatabaseType()
      const isPostgreSQL = dbType === "postgresql"

      if (isPostgreSQL) {
        await execute(
          `INSERT INTO site_logs (
            timestamp, level, category, message, context, metadata
          ) VALUES (NOW(), $1, $2, $3, $4, $5)`,
          [
            "debug",
            "system",
            `${context}: ${message}`,
            context,
            JSON.stringify({
              ...metadata,
              timestamp: new Date().toISOString(),
            }),
          ],
        )
      } else {
        await execute(
          `INSERT INTO site_logs (
            timestamp, level, category, message, context, metadata
          ) VALUES (datetime('now'), ?, ?, ?, ?, ?)`,
          [
            "debug",
            "system",
            `${context}: ${message}`,
            context,
            JSON.stringify({
              ...metadata,
              timestamp: new Date().toISOString(),
            }),
          ],
        )
      }
    } catch (logError) {
      console.error("[v0] Failed to log debug to database:", logError)
    }
  }
}
