"use client"

import React, { useState, useEffect } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/common/StatusBadge"
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils"
import {
  Laptop,
  User,
  History,
  Wrench,
  KeyRound,
  FileText,
  UserCheck,
  RotateCcw,
  Archive,
  Edit,
  Loader2,
  Calendar,
  MapPin,
  Barcode,
  Hash,
} from "lucide-react"
import api from "@/services/api"
import { toast } from "sonner"

export function AssetDrawer({
  assetId,
  open,
  onOpenChange,
  onEdit,
  onActionTrigger,
  onRefresh,
}) {
  const [asset, setAsset] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchAssetDetails = async (id) => {
    if (!id) return
    try {
      setLoading(true)
      const res = await api.get(`/assets/${id}`)
      setAsset(res.data)
    } catch (err) {
      console.error("Failed to fetch asset details:", err)
      toast.error("Could not load asset details.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && assetId) {
      fetchAssetDetails(assetId)
    } else {
      setAsset(null)
    }
  }, [open, assetId])

  if (!open) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl md:max-w-2xl overflow-y-auto p-0 flex flex-col">
        {loading ? (
          <div className="flex h-full flex-col items-center justify-center p-8 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Loading asset 360° profile...</p>
          </div>
        ) : !asset ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Asset details not found.
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Drawer Header */}
            <div className="p-6 pb-4 border-b bg-card space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-muted text-foreground border">
                      {asset.assetTag}
                    </span>
                    <StatusBadge status={asset.status} />
                  </div>
                  <SheetTitle className="text-xl font-bold tracking-tight">
                    {asset.brand} {asset.model}
                  </SheetTitle>
                  <SheetDescription className="text-xs">
                    {asset.category.replace("_", " ")} &bull; Located at {asset.location}
                  </SheetDescription>
                </div>
              </div>

              {/* State Machine Action Bar */}
              <div className="flex flex-wrap gap-2 pt-2">
                {asset.status === "AVAILABLE" && (
                  <Button
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                    onClick={() => {
                      onActionTrigger?.("ASSIGN", asset)
                    }}
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    <span>Assign Asset</span>
                  </Button>
                )}

                {asset.status === "ASSIGNED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1.5 border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
                    onClick={() => {
                      onActionTrigger?.("RETURN", asset)
                    }}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Request Return</span>
                  </Button>
                )}

                {asset.status === "RETURN_REQUESTED" && (
                  <Button
                    size="sm"
                    className="h-8 text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={() => {
                      onActionTrigger?.("PROCESS_RETURN", asset)
                    }}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Process Return Check-in</span>
                  </Button>
                )}

                {asset.status !== "RETIRED" && asset.status !== "IN_REPAIR" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1.5 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30"
                    onClick={() => {
                      onActionTrigger?.("REPAIR", asset)
                    }}
                  >
                    <Wrench className="h-3.5 w-3.5" />
                    <span>Send for Repair</span>
                  </Button>
                )}

                {asset.status === "IN_REPAIR" && (
                  <Button
                    size="sm"
                    className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => {
                      onActionTrigger?.("RESOLVE_REPAIR", asset)
                    }}
                  >
                    <Wrench className="h-3.5 w-3.5" />
                    <span>Resolve Repair</span>
                  </Button>
                )}

                {asset.status !== "RETIRED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      onActionTrigger?.("RETIRE", asset)
                    }}
                  >
                    <Archive className="h-3.5 w-3.5" />
                    <span>Retire</span>
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs gap-1.5 ml-auto text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    onEdit?.(asset)
                  }}
                >
                  <Edit className="h-3.5 w-3.5" />
                  <span>Edit Info</span>
                </Button>
              </div>
            </div>

            {/* 360 Details Tabs */}
            <div className="flex-1 p-6">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4 h-9">
                  <TabsTrigger value="overview" className="text-xs">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="custody" className="text-xs">
                    Custody ({asset.custodyRecords?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="service" className="text-xs">
                    Service ({asset.serviceRecords?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="audit" className="text-xs">
                    Audit Log
                  </TabsTrigger>
                </TabsList>

                {/* OVERVIEW TAB */}
                <TabsContent value="overview" className="space-y-6 pt-4">
                  {/* Current Custody Card */}
                  <div className="rounded-lg border bg-card p-4 space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <UserCheck className="h-3.5 w-3.5 text-primary" />
                      <span>Current Custody</span>
                    </h4>
                    {asset.currentCustody ? (
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <p className="text-sm font-semibold text-foreground">
                            {asset.currentCustody.employee?.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {asset.currentCustody.employee?.employeeId} &bull; {asset.currentCustody.employee?.department}
                          </p>
                          <p className="text-[11px] text-muted-foreground pt-1">
                            Issued on {formatDate(asset.currentCustody.checkoutDate)} (Condition: {asset.currentCustody.conditionCheckout})
                          </p>
                        </div>
                        <StatusBadge status="ASSIGNED" />
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        Not currently checked out to any employee. Status is {asset.status}.
                      </p>
                    )}
                  </div>

                  {/* Basic Specifications */}
                  <div className="rounded-lg border bg-card p-4 space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Laptop className="h-3.5 w-3.5 text-primary" />
                      <span>Technical & Purchase Specs</span>
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-muted-foreground">Brand</span>
                        <p className="font-medium text-foreground">{asset.brand}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Model</span>
                        <p className="font-medium text-foreground">{asset.model}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Serial Number</span>
                        <p className="font-mono font-medium text-foreground">{asset.serialNumber || "—"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Location</span>
                        <p className="font-medium text-foreground">{asset.location}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Purchase Date</span>
                        <p className="font-medium text-foreground">{formatDate(asset.purchaseDate)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Purchase Cost</span>
                        <p className="font-medium text-foreground">{formatCurrency(asset.purchaseCost)}</p>
                      </div>
                    </div>

                    {asset.notes && (
                      <div className="pt-2 border-t text-xs">
                        <span className="text-muted-foreground">Notes / Specifications:</span>
                        <p className="mt-1 text-foreground leading-relaxed">{asset.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Software License Specific Block */}
                  {asset.category === "SOFTWARE_LICENSE" && (
                    <div className="rounded-lg border bg-card p-4 space-y-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <KeyRound className="h-3.5 w-3.5 text-purple-500" />
                        <span>License Quota & Key</span>
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-muted-foreground">License Key</span>
                          <p className="font-mono text-[11px] font-medium text-foreground truncate bg-muted/60 p-1 rounded">
                            {asset.licenseKey || "—"}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Seat Usage</span>
                          <p className="font-bold text-foreground">
                            {asset.activeSeatsAllocated || 0} / {asset.seatQuota || 0} Seats
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Cost per Seat</span>
                          <p className="font-medium text-foreground">{formatCurrency(asset.costPerSeat)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Expiration Date</span>
                          <p className="font-medium text-foreground">{formatDate(asset.expirationDate)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* CUSTODY HISTORY TAB */}
                <TabsContent value="custody" className="space-y-4 pt-4">
                  {(!asset.custodyRecords || asset.custodyRecords.length === 0) ? (
                    <p className="text-xs text-muted-foreground py-6 text-center">
                      No custody records found for this asset.
                    </p>
                  ) : (
                    <div className="relative border-l border-border ml-3 space-y-6 py-2">
                      {asset.custodyRecords.map((custody) => (
                        <div key={custody.id} className="relative pl-6 space-y-1">
                          <span className={`absolute -left-1.5 top-1 h-3 w-3 rounded-full border-2 border-background ${custody.checkinDate ? "bg-muted-foreground" : "bg-primary"}`} />
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-foreground">
                              {custody.employee?.name} ({custody.employee?.employeeId})
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {custody.checkinDate ? "Returned" : "Active"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Checkout: {formatDateTime(custody.checkoutDate)} &bull; Condition: {custody.conditionCheckout}
                          </p>
                          {custody.checkinDate && (
                            <p className="text-xs text-muted-foreground">
                              Check-in: {formatDateTime(custody.checkinDate)} &bull; Return Condition: {custody.conditionReturn || "N/A"}
                            </p>
                          )}
                          {custody.notes && (
                            <p className="text-xs italic text-muted-foreground/90 bg-muted/30 p-2 rounded mt-1">
                              &ldquo;{custody.notes}&rdquo;
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* SERVICE HISTORY TAB */}
                <TabsContent value="service" className="space-y-4 pt-4">
                  {(!asset.serviceRecords || asset.serviceRecords.length === 0) ? (
                    <p className="text-xs text-muted-foreground py-6 text-center">
                      No service or repair records logged.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {asset.serviceRecords.map((srv) => (
                        <div key={srv.id} className="rounded-lg border p-3 bg-card space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-foreground">{srv.vendor}</span>
                            <StatusBadge status={srv.status} />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            <strong>Issue:</strong> {srv.issue}
                          </p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
                            <span>Cost: {formatCurrency(srv.cost)}</span>
                            <span>{formatDate(srv.serviceDate)}</span>
                          </div>
                          {srv.resolutionNotes && (
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 p-2 rounded">
                              <strong>Resolution:</strong> {srv.resolutionNotes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* AUDIT LOG TAB */}
                <TabsContent value="audit" className="space-y-3 pt-4">
                  {(!asset.auditLogs || asset.auditLogs.length === 0) ? (
                    <p className="text-xs text-muted-foreground py-6 text-center">
                      No specific audit events found.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {asset.auditLogs.map((log) => (
                        <div key={log.id} className="border-b pb-2.5 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-semibold text-foreground">
                              {log.action}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {formatDateTime(log.createdAt)}
                            </span>
                          </div>
                          <p className="text-muted-foreground">{log.details}</p>
                          <span className="text-[10px] text-muted-foreground/80">
                            by {log.user?.name || "System"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
