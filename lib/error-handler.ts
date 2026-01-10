import Logger from "./logger"

export interface ErrorContext {
  route?: string
  method?: string
  userId?: string
  component?: string
  action?: string
  metadata?: Record<string, any>
}

export class AppError extends Error {
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly context?: ErrorContext

  constructor(message: string, statusCode = 500, isOperational = true, context?: ErrorContext) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.context = context
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ErrorHandler {
  private static instance: ErrorHandler
  private logger: Logger

  private constructor() {
    this.logger = Logger.getInstance()
  }

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  public async handleError(error: Error | AppError, context?: ErrorContext): Promise<void> {
    console.error("[v0] Error occurred:", {
      message: error.message,
      stack: error.stack,
      context,
    })

    // Log to database
    await this.logger.logNextError(error, context)

    // If it's a critical error, you could send alerts here
    if (error instanceof AppError && !error.isOperational) {
      console.error("[v0] CRITICAL ERROR - Non-operational error occurred:", error)
      // TODO: Send alert to monitoring service (e.g., Sentry, email, Slack)
    }
  }

  public async handleAPIError(error: Error | AppError, route: string, method: string): Promise<Response> {
    await this.handleError(error, { route, method })

    if (error instanceof AppError) {
      return new Response(
        JSON.stringify({
          error: error.message,
          statusCode: error.statusCode,
          context: error.context,
        }),
        {
          status: error.statusCode,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }

  public wrapAsync<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    context?: ErrorContext,
  ): (...args: T) => Promise<R> {
    return async (...args: T): Promise<R> => {
      try {
        return await fn(...args)
      } catch (error) {
        await this.handleError(error as Error, context)
        throw error
      }
    }
  }
}

export const errorHandler = ErrorHandler.getInstance()

// Global error handlers for uncaught errors
if (typeof window === "undefined") {
  // Server-side error handlers
  process.on("uncaughtException", async (error: Error) => {
    console.error("[v0] Uncaught Exception:", error)
    await errorHandler.handleError(error, { component: "process", action: "uncaughtException" })
    process.exit(1)
  })

  process.on("unhandledRejection", async (reason: any) => {
    console.error("[v0] Unhandled Rejection:", reason)
    const error = reason instanceof Error ? reason : new Error(String(reason))
    await errorHandler.handleError(error, { component: "process", action: "unhandledRejection" })
  })
}

export default ErrorHandler
