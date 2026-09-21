"use client"

import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle } from "lucide-react"
import api from "@/services/api"
import { toast } from "sonner"

export function AssetActionDialog({
  actionType,
  asset,
  open,
  onOpenChange,
  onSuccess,
}) {
  const [employees, setEmployees] = useState([])
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState("")

  // Form states
  const [employeeId, setEmployeeId] = useState("")
  const [condition, setCondition] = useState("EXCELLENT")
  const [notes, setNotes] = useState("")
  const [reason, setReason] = useState("")
  const [vendor, setVendor] = useState("")
  const [issue, setIssue] = useState("")
  const [cost, setCost] = useState("")
  const [nextStatus, setNextStatus] = useState("AVAILABLE")
  const [resolutionNotes, setResolutionNotes] = useState("")

  useEffect(() => {
    if (open) {
      setApiError("")
      setNotes("")
      setReason("")
      setVendor("")
      setIssue("")
      setCost("")
      setResolutionNotes("")
      setCondition("EXCELLENT")
      setNextStatus("AVAILABLE")

      if (actionType === "ASSIGN" || actionType === "RETURN") {
        fetchEmployees()
      }
    }
  }, [open, actionType])

  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true)
      const res = await api.get("/employees?limit=100")
      setEmployees(res.data?.data || [])
      if (res.data?.data?.length > 0) {
        setEmployeeId(res.data.data[0].id)
      }
    } catch (err) {
      console.error("Failed to fetch employees:", err)
    } finally {
      setLoadingEmployees(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError("")
    setLoading(true)

    try {
      if (actionType === "ASSIGN") {
        if (!employeeId) {
          setApiError("Please select an employee.")
          setLoading(false)
          return
        }
        await api.post("/assignments", {
          assetId: asset.id,
          employeeId,
          conditionCheckout: condition,
          notes,
        })
        toast.success("✓ Asset assigned successfully.")
      } else if (actionType === "RETURN") {
        await api.post("/return-requests", {
          assetId: asset.id,
          reason,
          conditionNotes: notes,
        })
        toast.success("✓ Return request submitted successfully.")
      } else if (actionType === "PROCESS_RETURN") {
        // Find the return request ID if available
        const returnRes = await api.get(`/return-requests?status=PENDING`)
        const matchingRequest = returnRes.data?.data?.find(
          (r) => r.assetId === asset.id && r.status === "PENDING"
        )

        if (matchingRequest) {
          await api.put(`/return-requests/${matchingRequest.id}/process`, {
            conditionReturn: condition,
            notes,
            nextStatus,
          })
        } else {
          // Direct transition if no explicit return request record
          await api.post(`/assets/${asset.id}/transition`, {
            nextStatus,
            reason: `Return processed: ${notes}`,
          })
        }
        toast.success("✓ Return processed successfully.")
      } else if (actionType === "REPAIR") {
        if (!vendor.trim()) {
          setApiError("Vendor name is required.")
          setLoading(false)
          return
        }
        if (!issue.trim()) {
          setApiError("Issue description is required.")
          setLoading(false)
          return
        }
        await api.post("/service-records", {
          assetId: asset.id,
          vendor,
          issue,
          cost: cost ? parseFloat(cost) : 0,
        })
        toast.success("✓ Asset sent for service/repair.")
      } else if (actionType === "RESOLVE_REPAIR") {
        const serviceRes = await api.get(`/service-records?assetId=${asset.id}&status=OPEN`)
        const openRecord = serviceRes.data?.data?.[0]

        if (openRecord) {
          await api.put(`/service-records/${openRecord.id}/resolve`, {
            resolutionNotes,
            cost: cost ? parseFloat(cost) : openRecord.cost,
            nextStatus,
          })
        } else {
          await api.post(`/assets/${asset.id}/transition`, {
            nextStatus,
            reason: `Repair resolved: ${resolutionNotes}`,
          })
        }
        toast.success("✓ Service record resolved. Asset updated.")
      } else if (actionType === "RETIRE") {
        await api.post(`/assets/${asset.id}/transition`, {
          nextStatus: "RETIRED",
          reason: reason || "Asset decommissioned.",
        })
        toast.success("✓ Asset retired successfully.")
      }

      onSuccess?.()
      onOpenChange(false)
    } catch (err) {
      const msg = err.response?.data?.message || "Operation failed."
      setApiError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const getTitleAndDesc = () => {
    switch (actionType) {
      case "ASSIGN":
        return {
          title: `Assign Asset: ${asset?.assetTag}`,
          desc: "Allocate this asset to an employee and record custody.",
        }
      case "RETURN":
        return {
          title: `Request Return: ${asset?.assetTag}`,
          desc: "Initiate return workflow and transition asset to RETURN_REQUESTED.",
        }
      case "PROCESS_RETURN":
        return {
          title: `Check-in Return: ${asset?.assetTag}`,
          desc: "Inspect returning asset, log condition, and check into inventory.",
        }
      case "REPAIR":
        return {
          title: `Send to Repair: ${asset?.assetTag}`,
          desc: "Create service ticket and update asset state to IN_REPAIR.",
        }
      case "RESOLVE_REPAIR":
        return {
          title: `Resolve Repair: ${asset?.assetTag}`,
          desc: "Log service completion notes, total cost, and restore asset to Available.",
        }
      case "RETIRE":
        return {
          title: `Retire Asset: ${asset?.assetTag}`,
          desc: "Decommission asset into terminal state. This action cannot be reversed.",
        }
      default:
        return { title: "Asset Action", desc: "" }
    }
  }

  const { title, desc } = getTitleAndDesc()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">{title}</DialogTitle>
          <DialogDescription className="text-xs">{desc}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {apiError && (
            <Alert variant="destructive" className="py-2.5 px-3 text-xs">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="ml-2 font-medium">{apiError}</AlertDescription>
            </Alert>
          )}

          {/* ASSIGN FORM */}
          {actionType === "ASSIGN" && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Assign To Employee</Label>
                {loadingEmployees ? (
                  <p className="text-xs text-muted-foreground">Loading employees...</p>
                ) : (
                  <Select value={employeeId} onValueChange={setEmployeeId}>
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Select Employee" />
                    </SelectTrigger>
                    <SelectContent className="max-h-56">
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id} className="text-xs">
                          {emp.name} ({emp.employeeId} - {emp.department})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Condition at Checkout</Label>
                <Select value={condition} onValueChange={setCondition}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEW">New (Sealed / Unused)</SelectItem>
                    <SelectItem value="EXCELLENT">Excellent (Flawless)</SelectItem>
                    <SelectItem value="GOOD">Good (Minor cosmetic wear)</SelectItem>
                    <SelectItem value="FAIR">Fair (Visible signs of use)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Custody Notes / Accessories</Label>
                <Input
                  placeholder="e.g. Charger, USB-C cable, sleeve included"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="text-xs"
                />
              </div>
            </>
          )}

          {/* RETURN FORM */}
          {actionType === "RETURN" && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Return Reason</Label>
                <Input
                  placeholder="e.g. Upgrading machine, role transfer, project end"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Physical Condition Notes</Label>
                <Input
                  placeholder="e.g. Good condition, minor scratches on outer lid"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="text-xs"
                />
              </div>
            </>
          )}

          {/* PROCESS RETURN CHECK-IN FORM */}
          {actionType === "PROCESS_RETURN" && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Verified Condition on Return</Label>
                <Select value={condition} onValueChange={setCondition}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EXCELLENT">Excellent (Pristine)</SelectItem>
                    <SelectItem value="GOOD">Good (Standard wear)</SelectItem>
                    <SelectItem value="FAIR">Fair</SelectItem>
                    <SelectItem value="DAMAGED">Damaged / Needs Servicing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Target Asset State</Label>
                <Select value={nextStatus} onValueChange={setNextStatus}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AVAILABLE">AVAILABLE (Return to storage/ready)</SelectItem>
                    <SelectItem value="IN_REPAIR">IN_REPAIR (Send straight to service)</SelectItem>
                    <SelectItem value="RETIRED">RETIRED (End of life decommission)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Check-in Notes</Label>
                <Input
                  placeholder="e.g. Cleaned and stored in Shelf B"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="text-xs"
                />
              </div>
            </>
          )}

          {/* REPAIR FORM */}
          {actionType === "REPAIR" && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Service Vendor / Partner <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="e.g. Apple Authorized Care / Lenovo Support"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Issue Description <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="e.g. Broken screen hinge / battery replacement"
                  value={issue}
                  onChange={(e) => setIssue(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Estimated Cost (₹ INR)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 5000"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  className="text-xs"
                />
              </div>
            </>
          )}

          {/* RESOLVE REPAIR FORM */}
          {actionType === "RESOLVE_REPAIR" && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Resolution Notes</Label>
                <Input
                  placeholder="e.g. Motherboard swapped, hardware test passed"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Final Repair Cost (₹ INR)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 4500"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Target Asset State</Label>
                <Select value={nextStatus} onValueChange={setNextStatus}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AVAILABLE">AVAILABLE (Restored to active pool)</SelectItem>
                    <SelectItem value="RETIRED">RETIRED (Deemed unrepairable)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* RETIRE FORM */}
          {actionType === "RETIRE" && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Reason for Retirement</Label>
              <Input
                placeholder="e.g. Beyond economical repair, EOL policy reached"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="text-xs"
              />
            </div>
          )}

          <DialogFooter className="pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className={`text-xs ${actionType === "RETIRE" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}`}
            >
              {loading ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Processing...
                </span>
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
