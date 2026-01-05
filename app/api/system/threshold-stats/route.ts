import { NextResponse } from "next/server"
import { positionThresholdManager } from "@/lib/position-threshold-manager"
import { DatabaseManager } from "@/lib/database"

export async function GET() {
  try {
    const stats = await positionThresholdManager.getPositionStatistics()
    const db = DatabaseManager.getInstance()
    const settings = await db.getAllSettings()

    const thresholdPercent = Number.parseInt(settings.databaseThresholdPercent || "20")
    const baseLimit = Number.parseInt(settings.databaseSizeBase || "250")
    const mainLimit = Number.parseInt(settings.databaseSizeMain || "250")
    const realLimit = Number.parseInt(settings.databaseSizeReal || "250")

    const calculateStorageLimit = (limit: number) => Math.ceil(limit * (1 + thresholdPercent / 100))

    const formattedStats = [
      {
        tableName: "base_pseudo_positions",
        currentCount: stats.base_pseudo_positions?.[0]?.total || 0,
        limit: baseLimit,
        storageLimit: calculateStorageLimit(baseLimit),
        utilizationPercent: Math.round(
          ((stats.base_pseudo_positions?.[0]?.total || 0) / calculateStorageLimit(baseLimit)) * 100,
        ),
        status:
          (stats.base_pseudo_positions?.[0]?.total || 0) / calculateStorageLimit(baseLimit) > 0.9
            ? "critical"
            : (stats.base_pseudo_positions?.[0]?.total || 0) / calculateStorageLimit(baseLimit) > 0.7
              ? "warning"
              : "optimal",
      },
      {
        tableName: "pseudo_positions",
        currentCount: stats.pseudo_positions?.[0]?.total || 0,
        limit: mainLimit,
        storageLimit: calculateStorageLimit(mainLimit),
        utilizationPercent: Math.round(
          ((stats.pseudo_positions?.[0]?.total || 0) / calculateStorageLimit(mainLimit)) * 100,
        ),
        status:
          (stats.pseudo_positions?.[0]?.total || 0) / calculateStorageLimit(mainLimit) > 0.9
            ? "critical"
            : (stats.pseudo_positions?.[0]?.total || 0) / calculateStorageLimit(mainLimit) > 0.7
              ? "warning"
              : "optimal",
      },
      {
        tableName: "real_pseudo_positions",
        currentCount: stats.real_pseudo_positions?.[0]?.total || 0,
        limit: realLimit,
        storageLimit: calculateStorageLimit(realLimit),
        utilizationPercent: Math.round(
          ((stats.real_pseudo_positions?.[0]?.total || 0) / calculateStorageLimit(realLimit)) * 100,
        ),
        status:
          (stats.real_pseudo_positions?.[0]?.total || 0) / calculateStorageLimit(realLimit) > 0.9
            ? "critical"
            : (stats.real_pseudo_positions?.[0]?.total || 0) / calculateStorageLimit(realLimit) > 0.7
              ? "warning"
              : "optimal",
      },
    ]

    return NextResponse.json({ stats: formattedStats })
  } catch (error) {
    console.error("[v0] Failed to get threshold stats:", error)
    return NextResponse.json({ error: "Failed to load statistics" }, { status: 500 })
  }
}
