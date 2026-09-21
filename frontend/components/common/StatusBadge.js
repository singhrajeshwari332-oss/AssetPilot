import React from "react"
import { Badge } from "@/components/ui/badge"

const STATUS_CONFIG = {
  // Asset Statuses
  AVAILABLE: {
    label: "Available",
    variant: "success",
    dotColor: "bg-emerald-500",
  },
  ASSIGNED: {
    label: "Assigned",
    variant: "info",
    dotColor: "bg-sky-500",
  },
  RETURN_REQUESTED: {
    label: "Return Requested",
    variant: "warning",
    dotColor: "bg-amber-500",
  },
  IN_REPAIR: {
    label: "In Repair",
    variant: "destructive",
    dotColor: "bg-red-500",
  },
  RETIRED: {
    label: "Retired",
    variant: "secondary",
    dotColor: "bg-zinc-400",
  },

  // Service / Return statuses
  OPEN: {
    label: "Open / In Progress",
    variant: "destructive",
    dotColor: "bg-red-500",
  },
  RESOLVED: {
    label: "Resolved",
    variant: "success",
    dotColor: "bg-emerald-500",
  },
  PENDING: {
    label: "Pending Review",
    variant: "warning",
    dotColor: "bg-amber-500",
  },
  PROCESSED: {
    label: "Processed",
    variant: "success",
    dotColor: "bg-emerald-500",
  },
  ACTIVE: {
    label: "Active",
    variant: "success",
    dotColor: "bg-emerald-500",
  },
  REVOKED: {
    label: "Revoked",
    variant: "secondary",
    dotColor: "bg-zinc-400",
  },
}

export function StatusBadge({ status, className }) {
  const config = STATUS_CONFIG[status] || {
    label: status || "Unknown",
    variant: "outline",
    dotColor: "bg-muted-foreground",
  }

  return (
    <Badge variant={config.variant} className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 font-medium ${className || ""}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dotColor}`} />
      <span>{config.label}</span>
    </Badge>
  )
}
