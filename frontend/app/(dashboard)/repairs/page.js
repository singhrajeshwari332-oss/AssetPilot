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
import { StatusBadge } from "@/components/common/StatusBadge"
import { TableSkeleton } from "@/components/common/TableSkeleton"
import { EmptyState } from "@/components/common/EmptyState"
import { AssetActionDialog } from "@/components/assets/AssetActionDialog"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  Wrench,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  RefreshCw,
} from "lucide-react"
import api from "@/services/api"
import { toast } from "sonner"
import { useAuth } from "@/context/AuthContext"

export default function RepairsPage() {
  const { user } = useAuth()
  const isEmployee = user?.role === "EMPLOYEE"

  const [repairs, setRepairs] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState("ALL")
  const [page, setPage] = useState(1)

  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    limit: 15,
  })

  const [resolveModal, setResolveModal] = useState({
    open: false,
    asset: null,
  })

  const fetchRepairs = useCallback(async () => {
    try {
      setLoading(true)

      const res = await api.get("/service-records", {
        params: {
          status,
          page,
          limit: 15,
        },
      })

      setRepairs(res.data?.data || [])

      setPagination(
        res.data?.pagination || {
          total: 0,
          totalPages: 1,
          limit: 15,
        }
      )
    } catch (err) {
      console.error("Failed to load repair records:", err)
      toast.error("Failed to load service records.")
    } finally {
      setLoading(false)
    }
  }, [status, page])

  useEffect(() => {
    fetchRepairs()
  }, [fetchRepairs])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Hardware Service & Repairs
          </h1>

          <p className="text-xs text-muted-foreground mt-0.5">
            Track hardware tickets dispatched to external vendors, maintenance expenditures, and resolution diagnostics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRepairs}
            disabled={loading}
            className="h-8 gap-1.5 text-xs"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${
                loading ? "animate-spin" : ""
              }`}
            />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center justify-between bg-card p-3 rounded-lg border">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Filter Status:
          </span>

          <div className="w-40">
            <Select
              value={status}
              onValueChange={(val) => {
                setStatus(val)
                setPage(1)
              }}
            >
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="ALL" className="text-xs">
                  All Repairs
                </SelectItem>

                <SelectItem value="OPEN" className="text-xs">
                  In Progress (Open)
                </SelectItem>

                <SelectItem value="RESOLVED" className="text-xs">
                  Resolved
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Repairs Table */}
      <div className="rounded-lg border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[110px]">
                Asset Tag
              </TableHead>

              <TableHead>Hardware Model</TableHead>

              <TableHead>Service Vendor</TableHead>

              <TableHead>Issue Diagnostics</TableHead>

              <TableHead>Cost</TableHead>

              <TableHead className="w-[130px]">
                Status
              </TableHead>

              <TableHead className="hidden md:table-cell">
                Dispatched Date
              </TableHead>

              <TableHead className="text-right w-[130px]">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableSkeleton rows={5} columns={8} />
            ) : repairs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-64 p-0">
                  <EmptyState
                    icon={Wrench}
                    title="No service records"
                    description="There are currently no active repair records matching this filter."
                  />
                </TableCell>
              </TableRow>
            ) : (
              repairs.map((rep) => (
                <TableRow
                  key={rep.id}
                  className="hover:bg-muted/40 transition-colors"
                >
                  <TableCell className="font-mono text-xs font-bold text-foreground">
                    <span className="px-1.5 py-0.5 rounded bg-muted border">
                      {rep.asset?.assetTag}
                    </span>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-xs text-foreground">
                        {rep.asset?.brand}
                      </span>

                      <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                        {rep.asset?.model}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="text-xs font-medium text-foreground">
                    {rep.vendor}
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground max-w-xs">
                    <p className="font-medium text-foreground">
                      {rep.issue}
                    </p>

                    {rep.resolutionNotes && (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                        Fixed: {rep.resolutionNotes}
                      </p>
                    )}
                  </TableCell>

                  <TableCell className="text-xs font-semibold text-foreground">
                    {formatCurrency(rep.cost)}
                  </TableCell>

                  <TableCell>
                    <StatusBadge status={rep.status} />
                  </TableCell>

                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                    {formatDate(rep.serviceDate)}
                  </TableCell>

                  <TableCell className="text-right">
                    {rep.status === "OPEN" && !isEmployee ? (
                      <Button
                        size="sm"
                        onClick={() =>
                          setResolveModal({
                            open: true,
                            asset: rep.asset,
                          })
                        }
                        className="h-7 text-xs font-medium gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Resolve Repair</span>
                      </Button>
                    ) : rep.status === "OPEN" && isEmployee ? (
                      <span className="text-xs text-amber-600 font-medium inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        In Progress
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        Resolved on {formatDate(rep.resolvedAt)}
                      </span>
                    )}
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
              {repairs.length === 0
                ? 0
                : (page - 1) * pagination.limit + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium text-foreground">
              {Math.min(
                page * pagination.limit,
                pagination.total
              )}
            </span>{" "}
            of{" "}
            <span className="font-medium text-foreground">
              {pagination.total}
            </span>{" "}
            tickets
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPage((p) => Math.max(1, p - 1))
              }
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
              onClick={() =>
                setPage((p) =>
                  Math.min(
                    pagination.totalPages,
                    p + 1
                  )
                )
              }
              disabled={
                page >= pagination.totalPages || loading
              }
              className="h-7 w-7 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Resolve Repair Action Modal */}
      {!isEmployee && (
        <AssetActionDialog
          open={resolveModal.open}
          actionType="RESOLVE_REPAIR"
          asset={resolveModal.asset}
          onOpenChange={(open) =>
            setResolveModal((prev) => ({
              ...prev,
              open,
            }))
          }
          onSuccess={fetchRepairs}
        />
      )}
    </div>
  )
}