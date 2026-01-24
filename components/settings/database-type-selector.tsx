"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface DatabaseTypeSelectorProps {
  databaseType: string
  databaseUrl: string
  databaseChanged: boolean
  onTypeChange: (type: string) => void
  onUrlChange: (url: string) => void
  onSave: () => void
  onCancel: () => void
}

export function DatabaseTypeSelector({
  databaseType,
  databaseUrl,
  databaseChanged,
  onTypeChange,
  onUrlChange,
  onSave,
  onCancel,
}: DatabaseTypeSelectorProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Database Type</h3>
      <p className="text-xs text-muted-foreground">
        Select the database type. Changes require system restart.
      </p>
      <div className="grid md:grid-cols-3 gap-4">
        <Button
          variant={databaseType === "sqlite" ? "default" : "outline"}
          onClick={() => onTypeChange("sqlite")}
          disabled={databaseType === "sqlite"}
        >
          SQLite (Local)
        </Button>
        <Button
          variant={databaseType === "postgres" ? "default" : "outline"}
          onClick={() => onTypeChange("postgres")}
          disabled={databaseType === "postgres"}
        >
          PostgreSQL (Remote)
        </Button>
        <Button
          variant={databaseType === "neon" ? "default" : "outline"}
          onClick={() => onTypeChange("neon")}
          disabled={databaseType === "neon"}
        >
          Neon (Serverless)
        </Button>
      </div>
      {(databaseType === "postgres" || databaseType === "neon") && (
        <div className="space-y-2 mt-4">
          <Label>{databaseType === "neon" ? "Neon" : "PostgreSQL"} Connection URL</Label>
          <Input
            value={databaseUrl}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder={
              databaseType === "neon"
                ? "postgresql://user:password@ep-xxx.region.aws.neon.tech/database"
                : "postgresql://user:password@host:port/database"
            }
          />
        </div>
      )}
      {databaseChanged && (
        <div className="flex gap-2 pt-4">
          <Button onClick={onSave}>Save Database Changes</Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}
