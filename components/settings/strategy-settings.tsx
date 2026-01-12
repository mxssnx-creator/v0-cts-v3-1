"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface StrategySettingsProps {
  settings: any
  onSettingsChange: (updates: any) => void
}

export function StrategySettings({ settings, onSettingsChange }: StrategySettingsProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profit Factors</CardTitle>
          <CardDescription>Configure minimum profit requirements for strategies</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="strategyMinProfitFactor">Strategy Min Profit Factor</Label>
            <Input
              id="strategyMinProfitFactor"
              type="number"
              step="0.01"
              value={settings.strategyMinProfitFactor || 1.5}
              onChange={(e) => onSettingsChange({ strategyMinProfitFactor: Number.parseFloat(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="indicationMinProfitFactor">Indication Min Profit Factor</Label>
            <Input
              id="indicationMinProfitFactor"
              type="number"
              step="0.01"
              value={settings.indicationMinProfitFactor || 1.2}
              onChange={(e) => onSettingsChange({ indicationMinProfitFactor: Number.parseFloat(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profitFactorMultiplier">Profit Factor Multiplier</Label>
            <Input
              id="profitFactorMultiplier"
              type="number"
              step="0.01"
              value={settings.profitFactorMultiplier || 1.0}
              onChange={(e) => onSettingsChange({ profitFactorMultiplier: Number.parseFloat(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="baseVolumeFactor">Base Volume Factor</Label>
            <Input
              id="baseVolumeFactor"
              type="number"
              step="0.01"
              value={settings.baseVolumeFactor || 1.0}
              onChange={(e) => onSettingsChange({ baseVolumeFactor: Number.parseFloat(e.target.value) })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Strategy Features - Main System</CardTitle>
          <CardDescription>Enable or disable strategy features for main trading</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="strategyTrailingEnabled">Trailing Enabled</Label>
            <Switch
              id="strategyTrailingEnabled"
              checked={settings.strategyTrailingEnabled || false}
              onCheckedChange={(checked) => onSettingsChange({ strategyTrailingEnabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="trailingOnly">Trailing Only Mode</Label>
            <Switch
              id="trailingOnly"
              checked={settings.trailingOnly || false}
              onCheckedChange={(checked) => onSettingsChange({ trailingOnly: checked })}
              disabled={!settings.strategyTrailingEnabled}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <Label htmlFor="strategyBlockEnabled">Block Enabled</Label>
            <Switch
              id="strategyBlockEnabled"
              checked={settings.strategyBlockEnabled || false}
              onCheckedChange={(checked) => onSettingsChange({ strategyBlockEnabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="blockOnly">Block Only Mode</Label>
            <Switch
              id="blockOnly"
              checked={settings.blockOnly || false}
              onCheckedChange={(checked) => onSettingsChange({ blockOnly: checked })}
              disabled={!settings.strategyBlockEnabled}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <Label htmlFor="strategyDcaEnabled">DCA Enabled</Label>
            <Switch
              id="strategyDcaEnabled"
              checked={settings.strategyDcaEnabled || false}
              onCheckedChange={(checked) => onSettingsChange({ strategyDcaEnabled: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Block Strategy Settings</CardTitle>
          <CardDescription>Configure automatic block management</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="blockAutoDisableEnabled">Auto-Disable Enabled</Label>
            <Switch
              id="blockAutoDisableEnabled"
              checked={settings.blockAutoDisableEnabled || false}
              onCheckedChange={(checked) => onSettingsChange({ blockAutoDisableEnabled: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="blockAdjustmentRatio">Block Adjustment Ratio</Label>
            <Input
              id="blockAdjustmentRatio"
              type="number"
              step="0.01"
              value={settings.blockAdjustmentRatio || 0.8}
              onChange={(e) => onSettingsChange({ blockAdjustmentRatio: Number.parseFloat(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="blockAutoDisableMinBlocks">Min Blocks for Auto-Disable</Label>
            <Input
              id="blockAutoDisableMinBlocks"
              type="number"
              value={settings.blockAutoDisableMinBlocks || 5}
              onChange={(e) => onSettingsChange({ blockAutoDisableMinBlocks: Number.parseInt(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="blockAutoDisableComparisonWindow">Comparison Window (positions)</Label>
            <Input
              id="blockAutoDisableComparisonWindow"
              type="number"
              value={settings.blockAutoDisableComparisonWindow || 20}
              onChange={(e) => onSettingsChange({ blockAutoDisableComparisonWindow: Number.parseInt(e.target.value) })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Risk Management</CardTitle>
          <CardDescription>Configure risk parameters and limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Minimum Win Rate (%)</Label>
              <Badge variant="secondary">{settings.minWinRate || 50}%</Badge>
            </div>
            <Slider
              value={[settings.minWinRate || 50]}
              onValueChange={([value]) => onSettingsChange({ minWinRate: value })}
              min={0}
              max={100}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxDrawdownHours">Max Drawdown Hours</Label>
            <Input
              id="maxDrawdownHours"
              type="number"
              value={settings.maxDrawdownHours || 24}
              onChange={(e) => onSettingsChange({ maxDrawdownHours: Number.parseInt(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adjustStrategyDrawdownPositions">Drawdown Adjustment Positions</Label>
            <Input
              id="adjustStrategyDrawdownPositions"
              type="number"
              value={settings.adjustStrategyDrawdownPositions || 10}
              onChange={(e) => onSettingsChange({ adjustStrategyDrawdownPositions: Number.parseInt(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="positionsAverage">Positions Average</Label>
            <Input
              id="positionsAverage"
              type="number"
              value={settings.positionsAverage || 20}
              onChange={(e) => onSettingsChange({ positionsAverage: Number.parseInt(e.target.value) })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preset Trading Settings</CardTitle>
          <CardDescription>Configure settings specific to preset trading mode</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="presetTrailingEnabled">Preset Trailing Enabled</Label>
            <Switch
              id="presetTrailingEnabled"
              checked={settings.presetTrailingEnabled || false}
              onCheckedChange={(checked) => onSettingsChange({ presetTrailingEnabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="presetTrailingOnly">Preset Trailing Only</Label>
            <Switch
              id="presetTrailingOnly"
              checked={settings.presetTrailingOnly || false}
              onCheckedChange={(checked) => onSettingsChange({ presetTrailingOnly: checked })}
              disabled={!settings.presetTrailingEnabled}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <Label htmlFor="presetBlockEnabled">Preset Block Enabled</Label>
            <Switch
              id="presetBlockEnabled"
              checked={settings.presetBlockEnabled || false}
              onCheckedChange={(checked) => onSettingsChange({ presetBlockEnabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="presetBlockOnly">Preset Block Only</Label>
            <Switch
              id="presetBlockOnly"
              checked={settings.presetBlockOnly || false}
              onCheckedChange={(checked) => onSettingsChange({ presetBlockOnly: checked })}
              disabled={!settings.presetBlockEnabled}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <Label htmlFor="presetDcaEnabled">Preset DCA Enabled</Label>
            <Switch
              id="presetDcaEnabled"
              checked={settings.presetDcaEnabled || false}
              onCheckedChange={(checked) => onSettingsChange({ presetDcaEnabled: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="baseVolumeFactorPreset">Base Volume Factor (Preset)</Label>
            <Input
              id="baseVolumeFactorPreset"
              type="number"
              step="0.01"
              value={settings.baseVolumeFactorPreset || 1.0}
              onChange={(e) => onSettingsChange({ baseVolumeFactorPreset: Number.parseFloat(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profitFactorMinPreset">Min Profit Factor (Preset)</Label>
            <Input
              id="profitFactorMinPreset"
              type="number"
              step="0.01"
              value={settings.profitFactorMinPreset || 1.2}
              onChange={(e) => onSettingsChange({ profitFactorMinPreset: Number.parseFloat(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="drawdownTimePreset">Drawdown Time (Preset, hours)</Label>
            <Input
              id="drawdownTimePreset"
              type="number"
              value={settings.drawdownTimePreset || 12}
              onChange={(e) => onSettingsChange({ drawdownTimePreset: Number.parseInt(e.target.value) })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
