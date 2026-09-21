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
import { formatDate, formatDateTime } from "@/lib/utils"
import {
  RotateCcw,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  RefreshCw,
} from "lucide-react"
import api from "@/services/api"
import { toast } from "sonner"

export default function ReturnsPage() {
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState("ALL")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 15 })

  const [processModal, setProcessModal] = useState({
    open: false,
    asset: null,
  })

  const fetchReturns = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get("/return-requests", {
        params: { status, page, limit: 15 },
      })
      setReturns(res.data?.data || [])
      setPagination(res.data?.pagination || { total: 0, totalPages: 1, limit: 15 })
    } catch (err) {
      console.error("Failed to load return requests:", err)
      toast.error("Failed to load return requests.")
    } finally {
      setLoading(false)
    }
  }, [status, page])

  useEffect(() => {
    fetchReturns()
  }, [fetchReturns])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Asset Return Requests & Check-In
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Process incoming hardware turn-ins, evaluate asset condition, and return items to active pool.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchReturns}
            disabled={loading}
            className="h-8 gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center justify-between bg-card p-3 rounded-lg border">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Filter by Status:</span>
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
                <SelectItem value="ALL" className="text-xs">All Requests</SelectItem>
                <SelectItem value="PENDING" className="text-xs">Pending Review</SelectItem>
                <SelectItem value="PROCESSED" className="text-xs">Processed & Checked In</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Returns Table */}
      <div className="rounded-lg border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[110px]">Asset Tag</TableHead>
              <TableHead>Hardware Item</TableHead>
              <TableHead>Returning Employee</TableHead>
              <TableHead>Reason & Condition Notes</TableHead>
              <TableHead className="w-[130px]">Request Status</TableHead>
              <TableHead className="hidden md:table-cell">Requested Date</TableHead>
              <TableHead className="text-right w-[140px]">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableSkeleton rows={5} columns={7} />
            ) : returns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-64 p-0">
                  <EmptyState
                    icon={RotateCcw}
                    title="No return requests"
                    description="There are currently no asset return requests matching this filter."
                  />
                </TableCell>
              </TableRow>
            ) : (
              returns.map((ret) => (
                <TableRow key={ret.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-mono text-xs font-bold text-foreground">
                    <span className="px-1.5 py-0.5 rounded bg-muted border">
                      {ret.asset?.assetTag}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-xs text-foreground">
                        {ret.asset?.brand}
                      </span>
                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {ret.asset?.model}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-xs text-foreground">
                        {ret.employee?.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {ret.employee?.department}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-xs">
                    <p className="font-medium text-foreground">{ret.reason || "Standard Return"}</p>
                    {ret.conditionNotes && (
                      <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                        Notes: {ret.conditionNotes}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={ret.status} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                    {formatDate(ret.requestedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    {ret.status === "PENDING" ? (
                      <Button
                        size="sm"
                        onClick={() =>
                          setProcessModal({
                            open: true,
                            asset: ret.asset,
                          })
                        }
                        className="h-7 text-xs font-medium gap-1 bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Process Check-in</span>
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        Completed
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
              {returns.length === 0 ? 0 : (page - 1) * pagination.limit + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium text-foreground">
              {Math.min(page * pagination.limit, pagination.total)}
            </span>{" "}
            of <span className="font-medium text-foreground">{pagination.total}</span> records
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

      {/* Process Return Action Modal */}
      <AssetActionDialog
        open={processModal.open}
        actionType="PROCESS_RETURN"
        asset={processModal.asset}
        onOpenChange={(open) => setProcessModal((prev) => ({ ...prev, open }))}
        onSuccess={fetchReturns}
      />
    </div>
  )
}
