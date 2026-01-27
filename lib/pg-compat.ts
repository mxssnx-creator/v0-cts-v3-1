let postgres: any = null
try {
  postgres = require("postgres")
} catch {
  console.log("[v0] postgres package not available")
}

export class Pool {
  private sql: any

  constructor(config: any) {
    if (!postgres) {
      throw new Error("[v0] PostgreSQL not available in this environment")
    }
    
    const connectionString = config.connectionString || process.env.DATABASE_URL

    if (!connectionString) {
      throw new Error("Database connection string is required")
    }

    this.sql = postgres(connectionString, {
      max: config.max || 20,
      idle_timeout: config.idleTimeoutMillis ? config.idleTimeoutMillis / 1000 : 30,
      connect_timeout: config.connectionTimeoutMillis ? config.connectionTimeoutMillis / 1000 : 2,
      ssl: config.ssl === false ? false : config.ssl || "prefer",
      onnotice: () => {},
    })
  }

  async query(text: string, params?: any[]) {
    try {
      const rows = await this.sql.unsafe(text, params || [])
      return {
        rows,
        rowCount: rows.length,
      }
    } catch (error) {
      console.error("[v0] PostgreSQL query error:", error)
      throw error
    }
  }

  async end() {
    await this.sql.end()
  }
}
