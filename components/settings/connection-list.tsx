"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Download, Upload } from "lucide-react"
import { ConnectionCard, type ExchangeConnection } from "./connection-card"

interface ConnectionListProps {
  connections: ExchangeConnection[]
  onConnectionToggle: (id: string) => void
  onConnectionDelete: (id: string) => void
  onConnectionSelect: (id: string | null) => void
  onImportUserConnections: () => void
  onInitPredefinedConnections: () => void
}

export function ConnectionList({
  connections,
  onConnectionToggle,
  onConnectionDelete,
  onConnectionSelect,
  onImportUserConnections,
  onInitPredefinedConnections,
}: ConnectionListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [connectionToDelete, setConnectionToDelete] = useState<string | null>(null)

  const handleDeleteClick = (id: string) => {
    setConnectionToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (connectionToDelete) {
      await onConnectionDelete(connectionToDelete)
      setDeleteDialogOpen(false)
      setConnectionToDelete(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Exchange Connections</h3>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onImportUserConnections}>
              <Upload className="h-3 w-3 mr-2" />
              Import User
            </Button>
            <Button size="sm" variant="outline" onClick={onInitPredefinedConnections}>
              <Download className="h-3 w-3 mr-2" />
              Init Predefined
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Manage your exchange API connections. Enable/disable connections or delete them.
        </p>
      </div>

      <div className="grid gap-4">
        {connections.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No connections configured</p>
            <Button className="mt-4 bg-transparent" variant="outline" onClick={onImportUserConnections}>
              Import User Connections
            </Button>
          </Card>
        ) : (
          connections.map((conn) => (
            <ConnectionCard
              key={conn.id}
              connection={conn}
              onToggle={() => onConnectionToggle(conn.id)}
              onActivate={() => onConnectionSelect(conn.is_active ? null : conn.id)}
              onDelete={() => handleDeleteClick(conn.id)}
            />
          ))
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Connection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this connection? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
