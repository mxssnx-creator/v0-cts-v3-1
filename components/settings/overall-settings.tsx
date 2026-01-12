"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"

interface OverallSettingsProps {
  settings: any
  onSettingsChange: (updates: any) => void
}

export function OverallSettings({ settings, onSettingsChange }: OverallSettingsProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Trade Mode</CardTitle>
          <CardDescription>Select the primary trading mode for the system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tradeMode">Mode</Label>
            <Select
              value={settings.tradeMode || "main"}
              onValueChange={(value) => onSettingsChange({ tradeMode: value })}
            >
              <SelectTrigger id="tradeMode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="main">Main System</SelectItem>
                <SelectItem value="preset">Preset Trade</SelectItem>
                <SelectItem value="bot">Trading Bot</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Market Configuration</CardTitle>
          <CardDescription>Configure market data and analysis parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="marketTimeframe">Market Timeframe (minutes)</Label>
            <Input
              id="marketTimeframe"
              type="number"
              value={settings.marketTimeframe || 60}
              onChange={(e) => onSettingsChange({ marketTimeframe: Number.parseInt(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prehistoricDataDays">Historical Data Days</Label>
            <Input
              id="prehistoricDataDays"
              type="number"
              value={settings.prehistoricDataDays || 30}
              onChange={(e) => onSettingsChange({ prehistoricDataDays: Number.parseInt(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="positionCost">Position Cost (USDT)</Label>
            <Input
              id="positionCost"
              type="number"
              value={settings.positionCost || 100}
              onChange={(e) => onSettingsChange({ positionCost: Number.parseFloat(e.target.value) })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Leverage Settings</CardTitle>
          <CardDescription>Configure leverage and margin settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="useMaximalLeverage">Use Maximal Leverage</Label>
            <Switch
              id="useMaximalLeverage"
              checked={settings.useMaximalLeverage || false}
              onCheckedChange={(checked) => onSettingsChange({ useMaximalLeverage: checked })}
            />
          </div>

          {!settings.useMaximalLeverage && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Leverage Percentage</Label>
                <Badge variant="secondary">{settings.leveragePercentage || 50}%</Badge>
              </div>
              <Slider
                value={[settings.leveragePercentage || 50]}
                onValueChange={([value]) => onSettingsChange({ leveragePercentage: value })}
                min={1}
                max={100}
                step={1}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="defaultMarginType">Default Margin Type</Label>
            <Select
              value={settings.defaultMarginType || "isolated"}
              onValueChange={(value) => onSettingsChange({ defaultMarginType: value })}
            >
              <SelectTrigger id="defaultMarginType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="isolated">Isolated</SelectItem>
                <SelectItem value="cross">Cross</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultPositionMode">Default Position Mode</Label>
            <Select
              value={settings.defaultPositionMode || "hedge"}
              onValueChange={(value) => onSettingsChange({ defaultPositionMode: value })}
            >
              <SelectTrigger id="defaultPositionMode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hedge">Hedge Mode</SelectItem>
                <SelectItem value="oneway">One-Way Mode</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Symbol Configuration</CardTitle>
          <CardDescription>Configure symbol selection and limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="symbolsCount">Number of Symbols</Label>
            <Input
              id="symbolsCount"
              type="number"
              value={settings.symbolsCount || 50}
              onChange={(e) => onSettingsChange({ symbolsCount: Number.parseInt(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="symbolsExchangeCount">Symbols per Exchange</Label>
            <Input
              id="symbolsExchangeCount"
              type="number"
              value={settings.symbolsExchangeCount || 10}
              onChange={(e) => onSettingsChange({ symbolsExchangeCount: Number.parseInt(e.target.value) })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Engine Performance</CardTitle>
          <CardDescription>Configure trade engine intervals and performance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mainTradeInterval">Main Trade Interval (seconds)</Label>
            <Input
              id="mainTradeInterval"
              type="number"
              value={settings.mainTradeInterval || 60}
              onChange={(e) => onSettingsChange({ mainTradeInterval: Number.parseInt(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="presetTradeInterval">Preset Trade Interval (seconds)</Label>
            <Input
              id="presetTradeInterval"
              type="number"
              value={settings.presetTradeInterval || 30}
              onChange={(e) => onSettingsChange({ presetTradeInterval: Number.parseInt(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="monitoring_interval">Monitoring Interval (seconds)</Label>
            <Input
              id="monitoring_interval"
              type="number"
              value={settings.monitoring_interval || 10}
              onChange={(e) => onSettingsChange({ monitoring_interval: Number.parseInt(e.target.value) })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rate Limiting</CardTitle>
          <CardDescription>Configure API rate limiting and connection management</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rateLimitPerSecond">Rate Limit (requests/second)</Label>
            <Input
              id="rateLimitPerSecond"
              type="number"
              value={settings.rateLimitPerSecond || 10}
              onChange={(e) => onSettingsChange({ rateLimitPerSecond: Number.parseInt(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rateLimitDelay">Rate Limit Delay (ms)</Label>
            <Input
              id="rateLimitDelay"
              type="number"
              value={settings.rateLimitDelay || 100}
              onChange={(e) => onSettingsChange({ rateLimitDelay: Number.parseInt(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxConcurrentConnections">Max Concurrent Connections</Label>
            <Input
              id="maxConcurrentConnections"
              type="number"
              value={settings.maxConcurrentConnections || 5}
              onChange={(e) => onSettingsChange({ maxConcurrentConnections: Number.parseInt(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="connectionTimeout">Connection Timeout (ms)</Label>
            <Input
              id="connectionTimeout"
              type="number"
              value={settings.connectionTimeout || 30000}
              onChange={(e) => onSettingsChange({ connectionTimeout: Number.parseInt(e.target.value) })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
