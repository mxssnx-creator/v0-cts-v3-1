/**
 * SQLite Type Declarations
 * Provides type stubs for better-sqlite3 to avoid missing namespace errors during build
 * This allows the code to compile even when better-sqlite3 is not available
 */

declare namespace Database {
  interface Database {
    prepare(sql: string): Statement
    exec(sql: string): void
    pragma(pragma: string, options?: any): any
    close(): void
  }

  interface Statement {
    run(...params: any[]): RunResult
    get(...params: any[]): any
    all(...params: any[]): any[]
    finalize(): void
  }

  interface RunResult {
    changes: number
    lastInsertRowid: number
  }
}

export {}
