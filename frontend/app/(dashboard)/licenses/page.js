"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatusBadge } from "@/components/common/StatusBadge"
import { EmptyState } from "@/components/common/EmptyState"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { AllocateSeatDialog } from "@/components/licenses/AllocateSeatDialog"
import { AssetDialog } from "@/components/assets/AssetDialog"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  KeyRound,
  Search,
  Plus,
  UserCheck,
  RefreshCw,
  Layers,
} from "lucide-react"
import api from "@/services/api"
import { toast } from "sonner"
import { useAuth } from "@/context/AuthContext"

export default function LicensesPage() {
  const { user } = useAuth()
  const isEmployee = user?.role === "EMPLOYEE"

  const [licenses, setLicenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const [allocateModal, setAllocateModal] = useState({
    open: false,
    license: null,
  })

  const [createModalOpen, setCreateModalOpen] = useState(false)

  const [revokeModal, setRevokeModal] = useState({
    open: false,
    allocation: null,
    licenseName: "",
    loading: false,
  })

  const fetchLicenses = useCallback(async () => {
    try {
      setLoading(true)

      const res = await api.get("/licenses", {
        params: {
          search: search.trim(),
        },
      })

      setLicenses(res.data?.data || [])
    } catch (err) {
      console.error("Failed to load licenses:", err)
      toast.error("Failed to load software licenses.")
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    fetchLicenses()
  }, [fetchLicenses])

  const handleRevokeSeat = async () => {
    if (!revokeModal.allocation) return

    setRevokeModal((prev) => ({
      ...prev,
      loading: true,
    }))

    try {
      await api.put(
        `/license-allocations/${revokeModal.allocation.id}/revoke`
      )

      toast.success("✓ License seat revoked successfully.")

      setRevokeModal({
        open: false,
        allocation: null,
        licenseName: "",
        loading: false,
      })

      fetchLicenses()
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "✕ Failed to revoke license seat."

      toast.error(msg)

      setRevokeModal((prev) => ({
        ...prev,
        loading: false,
      }))
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Software License Management
          </h1>

          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor seat quotas, manage active allocations, and track license renewal deadlines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLicenses}
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

          {!isEmployee && (
            <Button
              size="sm"
              onClick={() => setCreateModalOpen(true)}
              className="h-8 gap-1.5 text-xs font-medium"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Register New License</span>
            </Button>
          )}
        </div>
      </div>

      {/* Search Filter */}
      <div className="flex items-center justify-between bg-card p-3 rounded-lg border">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />

          <Input
            placeholder="Search licenses by brand, software title, key..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs bg-background"
          />
        </div>

        {search && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearch("")}
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
          >
            Clear
          </Button>
        )}
      </div>

      {/* License Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Card
              key={idx}
              className="h-72 animate-pulse bg-muted/40"
            />
          ))}
        </div>
      ) : licenses.length === 0 ? (
        <EmptyState
          icon={KeyRound}
          title="No software licenses"
          description="There are currently no software licenses registered in the system."
          actionLabel={!isEmployee ? "Add License" : undefined}
          onAction={
            !isEmployee
              ? () => setCreateModalOpen(true)
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {licenses.map((lic) => {
            const isFull =
              lic.allocatedSeats >= lic.seatQuota &&
              lic.seatQuota > 0

            const percentageUsed =
              lic.seatQuota > 0
                ? Math.round(
                    (lic.allocatedSeats / lic.seatQuota) * 100
                  )
                : 0

            return (
              <Card
                key={lic.id}
                className="flex flex-col justify-between shadow-sm hover:border-primary/40 transition-colors"
              >
                <div>
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20">
                          {lic.assetTag}
                        </span>

                        <CardTitle className="text-base font-bold tracking-tight pt-1">
                          {lic.brand}
                        </CardTitle>

                        <CardDescription className="text-xs font-medium text-foreground">
                          {lic.model}
                        </CardDescription>
                      </div>

                      {lic.isExpired ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-destructive/15 text-destructive border border-destructive/20">
                          Expired
                        </span>
                      ) : lic.isExpiringSoon ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                          Expires Soon
                        </span>
                      ) : (
                        <StatusBadge status="AVAILABLE" />
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="p-5 pt-0 space-y-4">
                    {/* Seats Meter */}
                    <div className="space-y-1.5 bg-muted/30 p-3 rounded-lg border">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-muted-foreground flex items-center gap-1">
                          <Layers className="h-3.5 w-3.5 text-primary" />
                          <span>Seats Allocation:</span>
                        </span>

                        <span className="font-bold text-foreground">
                          {lic.allocatedSeats} / {lic.seatQuota}
                        </span>
                      </div>

                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isFull
                              ? "bg-amber-500"
                              : "bg-primary"
                          }`}
                          style={{
                            width: `${Math.min(
                              100,
                              percentageUsed
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex flex-col">
                        <span className="text-muted-foreground">
                          Cost per seat:
                        </span>

                        <span className="font-semibold text-foreground">
                          {formatCurrency(lic.costPerSeat)}
                        </span>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-muted-foreground">
                          Expires:
                        </span>

                        <span className="font-semibold text-foreground">
                          {formatDate(lic.expirationDate)}
                        </span>
                      </div>
                    </div>

                    {/* Active Allocations List */}
                    <div className="space-y-2 border-t pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Active Allocations (
                          {lic.activeAllocations?.length || 0})
                        </span>
                      </div>

                      {lic.activeAllocations?.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic py-2">
                          No seats currently assigned.
                        </p>
                      ) : (
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {lic.activeAllocations.map((alloc) => (
                            <div
                              key={alloc.id}
                              className="flex items-center justify-between p-2 rounded-md bg-muted/40 text-xs border"
                            >
                              <div className="flex flex-col">
                                <span className="font-medium text-foreground">
                                  {alloc.employee?.name}
                                </span>

                                <span className="text-[10px] text-muted-foreground">
                                  {alloc.employee?.department} &bull;{" "}
                                  {alloc.notes || "Assigned"}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium">
                                  Active
                                </span>

                                {!isEmployee && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      setRevokeModal({
                                        open: true,
                                        allocation: alloc,
                                        licenseName: `${lic.brand} ${lic.model}`,
                                        loading: false,
                                      })
                                    }
                                    className="h-6 px-2 text-xs text-destructive hover:bg-destructive/10"
                                  >
                                    Revoke
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </div>

                <CardFooter className="p-5 pt-0 border-t bg-muted/10 rounded-b-lg mt-2">
                  {!isEmployee && (
                    <Button
                      size="sm"
                      onClick={() =>
                        setAllocateModal({
                          open: true,
                          license: lic,
                        })
                      }
                      disabled={isFull}
                      className="w-full h-8 text-xs font-medium gap-1.5"
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      <span>
                        {isFull
                          ? "Seat Quota Full"
                          : "Allocate Seat"}
                      </span>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      {/* Allocate Seat Modal */}
      {!isEmployee && (
        <AllocateSeatDialog
          open={allocateModal.open}
          license={allocateModal.license}
          onOpenChange={(open) =>
            setAllocateModal((prev) => ({
              ...prev,
              open,
            }))
          }
          onSuccess={fetchLicenses}
        />
      )}

      {/* Register New License Modal */}
      {!isEmployee && (
        <AssetDialog
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          asset={{ category: "SOFTWARE_LICENSE" }}
          onSuccess={fetchLicenses}
        />
      )}

      {/* Revoke Seat Confirmation Modal */}
      {!isEmployee && (
        <ConfirmDialog
          open={revokeModal.open}
          onOpenChange={(open) =>
            setRevokeModal((prev) => ({
              ...prev,
              open,
            }))
          }
          title="Revoke License Seat?"
          description={`Are you sure you want to remove the license seat allocation for [${revokeModal.allocation?.employee?.name}] from ${revokeModal.licenseName}? This will immediately free up one seat in the quota.`}
          confirmLabel="Revoke Seat"
          cancelLabel="Cancel"
          variant="destructive"
          loading={revokeModal.loading}
          onConfirm={handleRevokeSeat}
        />
      )}
    </div>
  )
}