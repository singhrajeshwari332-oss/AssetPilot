"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TableSkeleton } from "@/components/common/TableSkeleton"
import { EmptyState } from "@/components/common/EmptyState"
import { formatDateTime } from "@/lib/utils"
import {
  History,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
} from "lucide-react"
import api from "@/services/api"
import { toast } from "sonner"

const ENTITY_TYPES = [
  { value: "ALL", label: "All Entities" },
  { value: "ASSET", label: "Assets" },
  { value: "EMPLOYEE", label: "Employees" },
  { value: "CUSTODY", label: "Custody Assignments" },
  { value: "RETURN_REQUEST", label: "Return Requests" },
  { value: "SERVICE", label: "Service / Repairs" },
  { value: "LICENSE", label: "Software Licenses" },
  { value: "USER", label: "Authentication" },
]

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [entityType, setEntityType] = useState("ALL")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 20 })

  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get("/audit-logs", {
        params: { entityType, page, limit: 20 },
      })
      setLogs(res.data?.data || [])
      setPagination(res.data?.pagination || { total: 0, totalPages: 1, limit: 20 })
    } catch (err) {
      console.error("Failed to load audit logs:", err)
      toast.error("Failed to load audit log trail.")
    } finally {
      setLoading(false)
    }
  }, [entityType, page])

  useEffect(() => {
    fetchAuditLogs()
  }, [fetchAuditLogs])

  const getActionBadgeColor = (action) => {
    if (action.includes("CREATE") || action.includes("ALLOCATE") || action.includes("RESOLVE")) {
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
    }
    if (action.includes("DELETE") || action.includes("REVOKE") || action.includes("RETIRE")) {
      return "bg-destructive/15 text-destructive border-destructive/20"
    }
    if (action.includes("RETURN") || action.includes("REPAIR")) {
      return "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20"
    }
    return "bg-primary/15 text-primary border-primary/20"
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Compliance & Audit Trail
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Immutable, cryptographic log of all state machine events, custody transfers, and user operations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAuditLogs}
            disabled={loading}
            className="h-8 gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Log</span>
          </Button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center justify-between bg-card p-3 rounded-lg border">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Filter Entity:</span>
          <div className="w-48">
            <Select
              value={entityType}
              onValueChange={(val) => {
                setEntityType(val)
                setPage(1)
              }}
            >
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENTITY_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value} className="text-xs">
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="rounded-lg border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[170px]">Timestamp</TableHead>
              <TableHead className="w-[180px]">Action Event</TableHead>
              <TableHead className="w-[120px]">Entity</TableHead>
              <TableHead>Event Details & Context</TableHead>
              <TableHead className="text-right w-[140px]">Performed By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableSkeleton rows={8} columns={5} />
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 p-0">
                  <EmptyState
                    icon={History}
                    title="No audit events found"
                    description="No system records match this entity category."
                  />
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="text-[11px] text-muted-foreground font-mono">
                    {formatDateTime(log.createdAt)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[11px] font-bold ${getActionBadgeColor(log.action)}`}
                    >
                      {log.action}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-medium text-foreground">
                    {log.entityType}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <p className="line-clamp-2 leading-relaxed text-foreground/90">
                      {log.details || "—"}
                    </p>
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground font-medium">
                    {log.user?.name || "System"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground bg-card">
          <div>
            Showing{" "}
            <span className="font-medium text-foreground">
              {logs.length === 0 ? 0 : (page - 1) * pagination.limit + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium text-foreground">
              {Math.min(page * pagination.limit, pagination.total)}
            </span>{" "}
            of <span className="font-medium text-foreground">{pagination.total}</span> events
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="h-7 w-7 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2">
              Page {page} of {pagination.totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages || loading}
              className="h-7 w-7 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
