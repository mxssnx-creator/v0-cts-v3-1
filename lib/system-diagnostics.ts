import fs from "fs/promises"
import path from "path"

export type DiagnosticSeverity = "critical" | "warning" | "info" | "success"
export type DiagnosticCategory = "database" | "exchange" | "trade-engine" | "api" | "system" | "network"

export interface SystemDiagnostic {
  id: string
  timestamp: string
  severity: DiagnosticSeverity
  category: DiagnosticCategory
  title: string
  message: string
  details: string
  stackTrace?: string
  metadata?: Record<string, any>
  resolved: boolean
  resolvedAt?: string
  resolvedBy?: string
  actions: DiagnosticAction[]
}

export interface DiagnosticAction {
  id: string
  label: string
  type: "fix" | "dismiss" | "view" | "retry" | "restart"
  executed: boolean
  executedAt?: string
  result?: string
}

export interface DiagnosticLog {
  timestamp: string
  action: string
  user?: string
  diagnosticId: string
  result: "success" | "failure" | "pending"
  details: string
}

const DIAGNOSTICS_DIR = path.join(process.cwd(), "logs", "diagnostics")
const DIAGNOSTICS_FILE = path.join(DIAGNOSTICS_DIR, "system-diagnostics.json")
const DIAGNOSTICS_LOG_FILE = path.join(DIAGNOSTICS_DIR, "diagnostic-actions.log")

// Ensure diagnostics directory exists
async function ensureDiagnosticsDir() {
  try {
    await fs.mkdir(DIAGNOSTICS_DIR, { recursive: true })
  } catch (error) {
    console.error("Failed to create diagnostics directory:", error)
  }
}

// Load all diagnostics from file
export async function loadDiagnostics(): Promise<SystemDiagnostic[]> {
  await ensureDiagnosticsDir()

  try {
    const data = await fs.readFile(DIAGNOSTICS_FILE, "utf-8")
    return JSON.parse(data)
  } catch (error) {
    // File doesn't exist or is invalid, return empty array
    return []
  }
}

// Save diagnostics to file
export async function saveDiagnostics(diagnostics: SystemDiagnostic[]): Promise<void> {
  await ensureDiagnosticsDir()

  try {
    await fs.writeFile(DIAGNOSTICS_FILE, JSON.stringify(diagnostics, null, 2), "utf-8")
  } catch (error) {
    console.error("Failed to save diagnostics:", error)
    throw error
  }
}

// Add a new diagnostic
export async function addDiagnostic(
  diagnostic: Omit<SystemDiagnostic, "id" | "timestamp" | "resolved">,
): Promise<SystemDiagnostic> {
  const diagnostics = await loadDiagnostics()

  const newDiagnostic: SystemDiagnostic = {
    ...diagnostic,
    id: `diag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    resolved: false,
  }

  diagnostics.unshift(newDiagnostic)

  // Keep only last 1000 diagnostics
  if (diagnostics.length > 1000) {
    diagnostics.splice(1000)
  }

  await saveDiagnostics(diagnostics)
  await logAction({
    timestamp: new Date().toISOString(),
    action: "create",
    diagnosticId: newDiagnostic.id,
    result: "success",
    details: `Created ${diagnostic.severity} diagnostic: ${diagnostic.title}`,
  })

  return newDiagnostic
}

// Resolve a diagnostic
export async function resolveDiagnostic(id: string, resolvedBy?: string): Promise<void> {
  const diagnostics = await loadDiagnostics()
  const diagnostic = diagnostics.find((d) => d.id === id)

  if (diagnostic) {
    diagnostic.resolved = true
    diagnostic.resolvedAt = new Date().toISOString()
    diagnostic.resolvedBy = resolvedBy
    await saveDiagnostics(diagnostics)

    await logAction({
      timestamp: new Date().toISOString(),
      action: "resolve",
      user: resolvedBy,
      diagnosticId: id,
      result: "success",
      details: `Resolved diagnostic: ${diagnostic.title}`,
    })
  }
}

// Execute an action
export async function executeAction(
  diagnosticId: string,
  actionId: string,
  user?: string,
): Promise<{ success: boolean; message: string }> {
  const diagnostics = await loadDiagnostics()
  const diagnostic = diagnostics.find((d) => d.id === diagnosticId)

  if (!diagnostic) {
    return { success: false, message: "Diagnostic not found" }
  }

  const action = diagnostic.actions.find((a) => a.id === actionId)

  if (!action) {
    return { success: false, message: "Action not found" }
  }

  // Mark action as executed
  action.executed = true
  action.executedAt = new Date().toISOString()

  const result = { success: true, message: `Action "${action.label}" executed successfully` }

  // Execute action based on type
  switch (action.type) {
    case "fix":
      action.result = "Attempted automatic fix"
      break
    case "dismiss":
      diagnostic.resolved = true
      diagnostic.resolvedAt = new Date().toISOString()
      diagnostic.resolvedBy = user
      action.result = "Diagnostic dismissed"
      break
    case "retry":
      action.result = "Retry initiated"
      break
    case "restart":
      action.result = "Restart command issued"
      break
    case "view":
      action.result = "Details viewed"
      break
  }

  await saveDiagnostics(diagnostics)

  await logAction({
    timestamp: new Date().toISOString(),
    action: `execute-${action.type}`,
    user,
    diagnosticId,
    result: "success",
    details: `Executed action "${action.label}" on diagnostic: ${diagnostic.title}`,
  })

  return result
}

// Log an action
async function logAction(log: DiagnosticLog): Promise<void> {
  await ensureDiagnosticsDir()

  const logLine = `[${log.timestamp}] [${log.result.toUpperCase()}] ${log.action} - DiagID:${log.diagnosticId}${log.user ? ` - User:${log.user}` : ""} - ${log.details}\n`

  try {
    await fs.appendFile(DIAGNOSTICS_LOG_FILE, logLine, "utf-8")
  } catch (error) {
    console.error("Failed to write diagnostic log:", error)
  }
}

// Get diagnostic logs
export async function getDiagnosticLogs(limit = 100): Promise<string[]> {
  await ensureDiagnosticsDir()

  try {
    const data = await fs.readFile(DIAGNOSTICS_LOG_FILE, "utf-8")
    const lines = data.trim().split("\n")
    return lines.slice(-limit).reverse()
  } catch (error) {
    return []
  }
}

// Get diagnostics by severity
export async function getDiagnosticsBySeverity(severity: DiagnosticSeverity): Promise<SystemDiagnostic[]> {
  const diagnostics = await loadDiagnostics()
  return diagnostics.filter((d) => d.severity === severity && !d.resolved)
}

// Get diagnostics by category
export async function getDiagnosticsByCategory(category: DiagnosticCategory): Promise<SystemDiagnostic[]> {
  const diagnostics = await loadDiagnostics()
  return diagnostics.filter((d) => d.category === category && !d.resolved)
}

// Clear old resolved diagnostics
export async function clearOldDiagnostics(daysOld = 30): Promise<number> {
  const diagnostics = await loadDiagnostics()
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysOld)

  const filtered = diagnostics.filter((d) => {
    if (!d.resolved) return true
    if (!d.resolvedAt) return true
    return new Date(d.resolvedAt) > cutoffDate
  })

  const removedCount = diagnostics.length - filtered.length

  if (removedCount > 0) {
    await saveDiagnostics(filtered)
    await logAction({
      timestamp: new Date().toISOString(),
      action: "cleanup",
      diagnosticId: "system",
      result: "success",
      details: `Cleared ${removedCount} old resolved diagnostics`,
    })
  }

  return removedCount
}
