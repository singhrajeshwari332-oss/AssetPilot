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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StatusBadge } from "@/components/common/StatusBadge"
import { TableSkeleton } from "@/components/common/TableSkeleton"
import { EmptyState } from "@/components/common/EmptyState"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { AssetDrawer } from "@/components/assets/AssetDrawer"
import { AssetDialog } from "@/components/assets/AssetDialog"
import { AssetActionDialog } from "@/components/assets/AssetActionDialog"
import {
  Laptop,
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  UserCheck,
  RotateCcw,
  Wrench,
  Archive,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
} from "lucide-react"
import api from "@/services/api"
import { toast } from "sonner"

const CATEGORIES = [
  { value: "ALL", label: "All Categories" },
  { value: "LAPTOP", label: "Laptops" },
  { value: "MONITOR", label: "Monitors" },
  { value: "MOBILE_DEVICE", label: "Mobile Devices" },
  { value: "PERIPHERAL", label: "Peripherals" },
  { value: "SOFTWARE_LICENSE", label: "Software Licenses" },
]

const STATUSES = [
  { value: "ALL", label: "All Statuses" },
  { value: "AVAILABLE", label: "Available" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "RETURN_REQUESTED", label: "Return Requested" },
  { value: "IN_REPAIR", label: "In Repair" },
  { value: "RETIRED", label: "Retired" },
]

export default function AssetsPage() {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("ALL")
  const [status, setStatus] = useState("ALL")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 10 })

  // Drawer and Modals state
  const [selectedAssetId, setSelectedAssetId] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState(null)

  const [actionModal, setActionModal] = useState({
    open: false,
    type: null,
    asset: null,
  })

  const [deleteModal, setDeleteModal] = useState({
    open: false,
    asset: null,
    loading: false,
  })

  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true)
      const params = {
        page,
        limit: 10,
        search: search.trim(),
        category,
        status,
      }
      const res = await api.get("/assets", { params })
      setAssets(res.data?.data || [])
      setPagination(res.data?.pagination || { total: 0, totalPages: 1, limit: 10 })
    } catch (err) {
      console.error("Failed to fetch assets:", err)
      toast.error("Failed to load asset directory.")
    } finally {
      setLoading(false)
    }
  }, [page, search, category, status])

  useEffect(() => {
    fetchAssets()
  }, [fetchAssets])

  // Handle Search submit / debounce
  const handleSearchChange = (e) => {
    setSearch(e.target.value)
    setPage(1)
  }

  const handleDeleteAsset = async () => {
    if (!deleteModal.asset) return
    setDeleteModal((prev) => ({ ...prev, loading: true }))

    try {
      await api.delete(`/assets/${deleteModal.asset.id}`)
      toast.success(`✓ Asset ${deleteModal.asset.assetTag} deleted successfully.`)
      setDeleteModal({ open: false, asset: null, loading: false })
      if (drawerOpen && selectedAssetId === deleteModal.asset.id) {
        setDrawerOpen(false)
      }
      fetchAssets()
    } catch (err) {
      const msg = err.response?.data?.message || "✕ Failed to delete asset."
      toast.error(msg)
      setDeleteModal((prev) => ({ ...prev, loading: false }))
    }
  }

  const triggerAction = (type, asset) => {
    setActionModal({
      open: true,
      type,
      asset,
    })
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Asset Inventory Directory
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Enterprise hardware & software asset registry with deterministic state enforcement.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAssets}
            disabled={loading}
            className="h-8 gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditingAsset(null)
              setDialogOpen(true)
            }}
            className="h-8 gap-1.5 text-xs font-medium"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Asset</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-card p-3 rounded-lg border">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by tag, model, serial, employee..."
            value={search}
            onChange={handleSearchChange}
            className="h-8 pl-8 text-xs bg-background"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="w-36">
            <Select
              value={category}
              onValueChange={(val) => {
                setCategory(val)
                setPage(1)
              }}
            >
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value} className="text-xs">
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-36">
            <Select
              value={status}
              onValueChange={(val) => {
                setStatus(val)
                setPage(1)
              }}
            >
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((st) => (
                  <SelectItem key={st.value} value={st.value} className="text-xs">
                    {st.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(search || category !== "ALL" || status !== "ALL") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("")
                setCategory("ALL")
                setStatus("ALL")
                setPage(1)
              }}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* High-Density Asset Table */}
      <div className="rounded-lg border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[110px]">Asset Tag</TableHead>
              <TableHead className="w-[130px]">Category</TableHead>
              <TableHead>Brand & Model</TableHead>
              <TableHead className="hidden lg:table-cell">Serial Number</TableHead>
              <TableHead>Assigned Employee</TableHead>
              <TableHead className="hidden md:table-cell">Department</TableHead>
              <TableHead className="w-[130px]">Status</TableHead>
              <TableHead className="hidden xl:table-cell">Location</TableHead>
              <TableHead className="text-right w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableSkeleton rows={8} columns={9} />
            ) : assets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-64 p-0">
                  <EmptyState
                    icon={Laptop}
                    title="No assets found"
                    description="No inventory records matched your search parameters or filter criteria."
                    actionLabel="Add New Asset"
                    onAction={() => {
                      setEditingAsset(null)
                      setDialogOpen(true)
                    }}
                  />
                </TableCell>
              </TableRow>
            ) : (
              assets.map((item) => (
                <TableRow
                  key={item.id}
                  className="cursor-pointer hover:bg-muted/40 transition-colors"
                  onClick={() => {
                    setSelectedAssetId(item.id)
                    setDrawerOpen(true)
                  }}
                >
                  <TableCell className="font-mono text-xs font-bold text-foreground">
                    <span className="px-1.5 py-0.5 rounded bg-muted border">
                      {item.assetTag}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-medium">
                    {item.category.replace("_", " ")}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-xs text-foreground">
                        {item.brand}
                      </span>
                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {item.model}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell font-mono text-xs text-muted-foreground">
                    {item.serialNumber || "—"}
                  </TableCell>
                  <TableCell>
                    {item.currentEmployee ? (
                      <div className="flex flex-col">
                        <span className="font-medium text-xs text-foreground">
                          {item.currentEmployee.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {item.currentEmployee.employeeId}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                    {item.currentEmployee?.department || "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={item.status} />
                  </TableCell>
                  <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">
                    {item.location}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          aria-label="Asset actions"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 text-xs">
                        <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground">
                          {item.assetTag} Actions
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedAssetId(item.id)
                            setDrawerOpen(true)
                          }}
                          className="gap-2 cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5 text-primary" />
                          <span>View 360° Sheet</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingAsset(item)
                            setDialogOpen(true)
                          }}
                          className="gap-2 cursor-pointer"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          <span>Edit Details</span>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        {/* State Transitions */}
                        {item.status === "AVAILABLE" && (
                          <DropdownMenuItem
                            onClick={() => triggerAction("ASSIGN", item)}
                            className="gap-2 cursor-pointer text-emerald-600 dark:text-emerald-400"
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                            <span>Assign to Employee</span>
                          </DropdownMenuItem>
                        )}

                        {item.status === "ASSIGNED" && (
                          <DropdownMenuItem
                            onClick={() => triggerAction("RETURN", item)}
                            className="gap-2 cursor-pointer text-amber-600 dark:text-amber-400"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>Request Return</span>
                          </DropdownMenuItem>
                        )}

                        {item.status === "RETURN_REQUESTED" && (
                          <DropdownMenuItem
                            onClick={() => triggerAction("PROCESS_RETURN", item)}
                            className="gap-2 cursor-pointer text-amber-600 dark:text-amber-400"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>Process Return Check-in</span>
                          </DropdownMenuItem>
                        )}

                        {item.status !== "RETIRED" && item.status !== "IN_REPAIR" && (
                          <DropdownMenuItem
                            onClick={() => triggerAction("REPAIR", item)}
                            className="gap-2 cursor-pointer text-red-600 dark:text-red-400"
                          >
                            <Wrench className="h-3.5 w-3.5" />
                            <span>Send to Repair</span>
                          </DropdownMenuItem>
                        )}

                        {item.status === "IN_REPAIR" && (
                          <DropdownMenuItem
                            onClick={() => triggerAction("RESOLVE_REPAIR", item)}
                            className="gap-2 cursor-pointer text-emerald-600 dark:text-emerald-400"
                          >
                            <Wrench className="h-3.5 w-3.5" />
                            <span>Resolve Repair</span>
                          </DropdownMenuItem>
                        )}

                        {item.status !== "RETIRED" && (
                          <DropdownMenuItem
                            onClick={() => triggerAction("RETIRE", item)}
                            className="gap-2 cursor-pointer text-zinc-500"
                          >
                            <Archive className="h-3.5 w-3.5" />
                            <span>Retire Asset</span>
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          onClick={() => setDeleteModal({ open: true, asset: item, loading: false })}
                          disabled={item.status === "ASSIGNED"}
                          className="gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete Asset</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
              {assets.length === 0 ? 0 : (page - 1) * pagination.limit + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium text-foreground">
              {Math.min(page * pagination.limit, pagination.total)}
            </span>{" "}
            of <span className="font-medium text-foreground">{pagination.total}</span> assets
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

      {/* Asset 360° Drawer */}
      <AssetDrawer
        assetId={selectedAssetId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onEdit={(asset) => {
          setEditingAsset(asset)
          setDialogOpen(true)
        }}
        onActionTrigger={(type, asset) => {
          triggerAction(type, asset)
        }}
        onRefresh={fetchAssets}
      />

      {/* Create / Edit Asset Modal */}
      <AssetDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        asset={editingAsset}
        onSuccess={fetchAssets}
      />

      {/* State Machine Transition Dialog */}
      <AssetActionDialog
        open={actionModal.open}
        actionType={actionModal.type}
        asset={actionModal.asset}
        onOpenChange={(open) => setActionModal((prev) => ({ ...prev, open }))}
        onSuccess={() => {
          fetchAssets()
          if (drawerOpen && selectedAssetId) {
            // refresh drawer
            setDrawerOpen(false)
            setTimeout(() => {
              setDrawerOpen(true)
            }, 100)
          }
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteModal.open}
        onOpenChange={(open) => setDeleteModal((prev) => ({ ...prev, open }))}
        title="Delete Asset Record?"
        description={`Are you sure you want to permanently delete asset [${deleteModal.asset?.assetTag}] (${deleteModal.asset?.brand} ${deleteModal.asset?.model})? This action cannot be undone.`}
        confirmLabel="Delete Asset"
        variant="destructive"
        loading={deleteModal.loading}
        onConfirm={handleDeleteAsset}
      />
    </div>
  )
}
