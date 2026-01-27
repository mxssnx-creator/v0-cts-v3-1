/**
 * Global API Error Handling & Response Standardization
 * Ensures all APIs return consistent error responses with proper logging
 */

import { NextResponse } from "next/server"
import { SystemLogger } from "@/lib/system-logger"
import { ErrorRecoveryManager } from "@/lib/error-recovery"

export interface StandardAPIResponse<T = any> {
  success: boolean
  status: number
  data?: T
  error?: string
  details?: string
  timestamp: string
  requestId?: string
}

export class APIErrorHandler {
  /**
   * Wrap API handler with error handling
   */
  static async wrap<T>(
    handler: () => Promise<NextResponse<StandardAPIResponse<T>>>,
    context: {
      method: string
      path: string
      operationName: string
    }
  ): Promise<NextResponse<StandardAPIResponse<T>>> {
    try {
      console.log(`[v0] ${context.method} ${context.path} - ${context.operationName}`)
      return await handler()
    } catch (error) {
      console.error(`[v0] Error in ${context.operationName}:`, error)

      // Log error with context
      await SystemLogger.logError(error, "api", context.operationName, {
        method: context.method,
        path: context.path,
      })

      // Handle error recovery
      await ErrorRecoveryManager.handleError(error, {
        component: "api",
        action: context.operationName,
      })

      // Return standardized error response
      return this.createErrorResponse(
        error,
        context.operationName,
        500
      )
    }
  }

  /**
   * Create standardized error response
   */
  static createErrorResponse(
    error: Error | unknown,
    operation: string,
    statusCode: number = 500
  ): NextResponse<StandardAPIResponse> {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const isDatabaseError = errorMessage.includes("database") || errorMessage.includes("SQL")
    const isValidationError = errorMessage.includes("validation") || errorMessage.includes("required")
    const isNotFoundError = errorMessage.includes("not found") || errorMessage.includes("does not exist")

    let status = statusCode
    let error_message = errorMessage

    if (isNotFoundError) {
      status = 404
      error_message = "Resource not found"
    } else if (isValidationError) {
      status = 400
      error_message = "Invalid request data"
    } else if (isDatabaseError) {
      status = 503
      error_message = "Database service unavailable"
    }

    return NextResponse.json(
      {
        success: false,
        status,
        error: error_message,
        details: error instanceof Error ? error.message : undefined,
        timestamp: new Date().toISOString(),
      },
      { status }
    )
  }

  /**
   * Create standardized success response
   */
  static createSuccessResponse<T>(
    data: T,
    statusCode: number = 200,
    message?: string
  ): NextResponse<StandardAPIResponse<T>> {
    return NextResponse.json(
      {
        success: true,
        status: statusCode,
        data,
        timestamp: new Date().toISOString(),
      },
      { status: statusCode }
    )
  }

  /**
   * Validate required fields
   */
  static validateRequired(data: Record<string, any>, fields: string[]): { valid: boolean; error?: string } {
    for (const field of fields) {
      if (data[field] === undefined || data[field] === null || data[field] === "") {
        return {
          valid: false,
          error: `Required field missing: ${field}`,
        }
      }
    }
    return { valid: true }
  }

  /**
   * Safe JSON parse with error handling
   */
  static safeJsonParse<T>(jsonString: string, defaultValue: T): T {
    try {
      return JSON.parse(jsonString) as T
    } catch (error) {
      console.warn(`[v0] Failed to parse JSON, returning default:`, error)
      return defaultValue
    }
  }
}

/**
 * Retry logic with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  initialDelayMs: number = 100
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      console.warn(`[v0] Attempt ${attempt}/${maxAttempts} failed:`, lastError.message)

      if (attempt < maxAttempts) {
        const delayMs = initialDelayMs * Math.pow(2, attempt - 1)
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }
  }

  throw lastError || new Error("Operation failed after all retry attempts")
}
