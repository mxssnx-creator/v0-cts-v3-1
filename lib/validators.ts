/**
 * Comprehensive data validation utilities
 * Ensures all system data passes integrity checks
 */

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  sanitized?: any
}

/**
 * Validate connection data
 */
export function validateConnection(data: any): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!data) {
    return { isValid: false, errors: ["Connection data is null or undefined"] }
  }

  // Required fields
  if (!data.id || typeof data.id !== "string") {
    errors.push("Connection ID is required and must be a string")
  }

  if (!data.name || typeof data.name !== "string") {
    errors.push("Connection name is required and must be a string")
  }

  if (!data.exchange || typeof data.exchange !== "string") {
    errors.push("Exchange is required and must be a string")
  }

  // Supported exchanges
  const supportedExchanges = [
    "bybit",
    "bingx",
    "pionex",
    "orangex",
    "binance",
    "okx",
    "gateio",
    "mexc",
    "bitget",
    "kucoin",
    "huobi",
  ]

  if (data.exchange && !supportedExchanges.includes(data.exchange.toLowerCase())) {
    errors.push(`Exchange must be one of: ${supportedExchanges.join(", ")}`)
  }

  // API credentials
  if (data.api_key) {
    if (typeof data.api_key !== "string") {
      errors.push("API key must be a string")
    } else if (data.api_key.length < 10) {
      errors.push("API key seems too short")
    }
  }

  if (data.api_secret) {
    if (typeof data.api_secret !== "string") {
      errors.push("API secret must be a string")
    } else if (data.api_secret.length < 10) {
      errors.push("API secret seems too short")
    }
  }

  // Optional fields validation
  if (data.is_enabled !== undefined && typeof data.is_enabled !== "boolean") {
    warnings.push("is_enabled should be a boolean")
  }

  if (data.is_live_trade !== undefined && typeof data.is_live_trade !== "boolean") {
    warnings.push("is_live_trade should be a boolean")
  }

  if (data.is_testnet !== undefined && typeof data.is_testnet !== "boolean") {
    warnings.push("is_testnet should be a boolean")
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitized: {
      id: data.id,
      name: typeof data.name === "string" ? data.name.trim() : "",
      exchange: typeof data.exchange === "string" ? data.exchange.toLowerCase() : "",
      api_key: data.api_key, // Never sanitize secrets
      api_secret: data.api_secret,
      api_passphrase: data.api_passphrase,
      is_enabled: data.is_enabled !== false,
      is_live_trade: data.is_live_trade === true,
      is_testnet: data.is_testnet === true,
      is_active: data.is_active !== false,
    },
  }
}

/**
 * Validate indication data
 */
export function validateIndication(data: any): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!data) {
    return { isValid: false, errors: ["Indication data is null"] }
  }

  if (!data.connection_id || typeof data.connection_id !== "string") {
    errors.push("Connection ID is required")
  }

  if (!data.symbol || typeof data.symbol !== "string") {
    errors.push("Symbol is required")
  }

  if (data.is_active !== undefined && typeof data.is_active !== "boolean") {
    warnings.push("is_active should be a boolean")
  }

  if (data.strength !== undefined) {
    if (typeof data.strength !== "number" || data.strength < 0 || data.strength > 100) {
      warnings.push("Strength should be a number between 0-100")
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validate strategy data
 */
export function validateStrategy(data: any): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!data) {
    return { isValid: false, errors: ["Strategy data is null"] }
  }

  if (!data.connection_id || typeof data.connection_id !== "string") {
    errors.push("Connection ID is required")
  }

  if (!data.name || typeof data.name !== "string") {
    errors.push("Strategy name is required")
  }

  if (data.is_active !== undefined && typeof data.is_active !== "boolean") {
    warnings.push("is_active should be a boolean")
  }

  if (data.min_profit_percent !== undefined && typeof data.min_profit_percent !== "number") {
    warnings.push("min_profit_percent should be a number")
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validate position data
 */
export function validatePosition(data: any): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!data) {
    return { isValid: false, errors: ["Position data is null"] }
  }

  if (!data.connection_id || typeof data.connection_id !== "string") {
    errors.push("Connection ID is required")
  }

  if (!data.symbol || typeof data.symbol !== "string") {
    errors.push("Symbol is required")
  }

  if (data.status && !["open", "closed", "pending"].includes(data.status)) {
    errors.push("Status must be one of: open, closed, pending")
  }

  if (data.volume !== undefined) {
    if (typeof data.volume !== "number" || data.volume <= 0) {
      errors.push("Volume must be a positive number")
    }
  }

  if (data.entry_price !== undefined) {
    if (typeof data.entry_price !== "number" || data.entry_price <= 0) {
      errors.push("Entry price must be a positive number")
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Sanitize string input (prevent injection attacks)
 */
export function sanitizeString(value: string, maxLength: number = 255): string {
  if (!value || typeof value !== "string") return ""

  return value
    .trim()
    .substring(0, maxLength)
    .replace(/[<>\"'`]/g, "") // Remove potentially dangerous characters
}

/**
 * Sanitize number input
 */
export function sanitizeNumber(value: any, min: number = -Infinity, max: number = Infinity): number {
  const num = Number(value)
  if (isNaN(num)) return 0
  return Math.max(min, Math.min(max, num))
}

/**
 * Validate JSON structure
 */
export function validateJSON(jsonString: string): ValidationResult {
  try {
    JSON.parse(jsonString)
    return { isValid: true, errors: [], warnings: [] }
  } catch (error) {
    return {
      isValid: false,
      errors: [`Invalid JSON: ${error instanceof Error ? error.message : "Unknown error"}`],
      warnings: [],
    }
  }
}

/**
 * Batch validate connections
 */
export function validateConnectionBatch(connections: any[]): {
  valid: any[]
  invalid: Array<{ data: any; errors: string[] }>
} {
  const valid = []
  const invalid = []

  for (const conn of connections) {
    const validation = validateConnection(conn)
    if (validation.isValid) {
      valid.push(validation.sanitized || conn)
    } else {
      invalid.push({ data: conn, errors: validation.errors })
    }
  }

  return { valid, invalid }
}
