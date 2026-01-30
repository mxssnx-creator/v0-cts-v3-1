"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/lib/simple-toast"
import { Loader2 } from "lucide-react"

export interface ConnectionEditDialogProps {
  isOpen: boolean
  connection: any | null
  onClose: () => void
  onSave: (data: any) => Promise<void>
}

export function ConnectionEditDialog({ isOpen, connection, onClose, onSave }: ConnectionEditDialogProps) {
  const [formData, setFormData] = useState({
    name: connection?.name || "",
    api_key: connection?.api_key || "",
    api_secret: connection?.api_secret || "",
    api_passphrase: connection?.api_passphrase || "",
    margin_type: connection?.margin_type || "cross",
    position_mode: connection?.position_mode || "hedge",
    volume_factor: connection?.volume_factor || 1.0,
  })

  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error for this field
    setErrors((prev) => ({ ...prev, [field]: "" }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = "Name is required"
    if (!formData.api_key.trim()) newErrors.api_key = "API Key is required"
    if (!formData.api_secret.trim()) newErrors.api_secret = "API Secret is required"
    if (formData.volume_factor <= 0) newErrors.volume_factor = "Volume factor must be positive"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setIsSaving(true)
    try {
      await onSave(formData)
      toast.success("Connection Updated", {
        description: "Connection settings have been saved successfully",
      })
      onClose()
    } catch (error) {
      toast.error("Save Failed", {
        description: error instanceof Error ? error.message : "Failed to save connection",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (!connection) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Connection: {connection.name}</DialogTitle>
          <DialogDescription>
            Update connection settings for {connection.exchange}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Connection Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Connection Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="e.g., Bybit Main Account"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <Label htmlFor="api_key">API Key</Label>
            <Input
              id="api_key"
              type="password"
              value={formData.api_key}
              onChange={(e) => handleChange("api_key", e.target.value)}
              placeholder="Enter your API key"
              className={errors.api_key ? "border-red-500" : ""}
            />
            {errors.api_key && <p className="text-xs text-red-500">{errors.api_key}</p>}
          </div>

          {/* API Secret */}
          <div className="space-y-2">
            <Label htmlFor="api_secret">API Secret</Label>
            <Input
              id="api_secret"
              type="password"
              value={formData.api_secret}
              onChange={(e) => handleChange("api_secret", e.target.value)}
              placeholder="Enter your API secret"
              className={errors.api_secret ? "border-red-500" : ""}
            />
            {errors.api_secret && <p className="text-xs text-red-500">{errors.api_secret}</p>}
          </div>

          {/* API Passphrase (optional) */}
          {connection.exchange === "okx" && (
            <div className="space-y-2">
              <Label htmlFor="api_passphrase">API Passphrase</Label>
              <Input
                id="api_passphrase"
                type="password"
                value={formData.api_passphrase}
                onChange={(e) => handleChange("api_passphrase", e.target.value)}
                placeholder="Enter API passphrase (if required)"
              />
            </div>
          )}

          {/* Margin Type */}
          <div className="space-y-2">
            <Label htmlFor="margin_type">Margin Type</Label>
            <Select value={formData.margin_type} onValueChange={(value) => handleChange("margin_type", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cross">Cross Margin</SelectItem>
                <SelectItem value="isolated">Isolated Margin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Position Mode */}
          <div className="space-y-2">
            <Label htmlFor="position_mode">Position Mode</Label>
            <Select value={formData.position_mode} onValueChange={(value) => handleChange("position_mode", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hedge">Hedge Mode</SelectItem>
                <SelectItem value="one_way">One-Way Mode</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Volume Factor */}
          <div className="space-y-2">
            <Label htmlFor="volume_factor">Volume Factor</Label>
            <Input
              id="volume_factor"
              type="number"
              step="0.1"
              min="0.1"
              value={formData.volume_factor}
              onChange={(e) => handleChange("volume_factor", parseFloat(e.target.value))}
              placeholder="1.0"
              className={errors.volume_factor ? "border-red-500" : ""}
            />
            {errors.volume_factor && <p className="text-xs text-red-500">{errors.volume_factor}</p>}
            <p className="text-xs text-muted-foreground">Multiplier for order volume (1.0 = 100%)</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
