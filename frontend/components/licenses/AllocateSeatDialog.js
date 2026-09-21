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

export function AllocateSeatDialog({ open, onOpenChange, license, onSuccess }) {
  const [employees, setEmployees] = useState([])
  const [employeeId, setEmployeeId] = useState("")
  const [notes, setNotes] = useState("")
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState("")

  useEffect(() => {
    if (open) {
      setApiError("")
      setNotes("")
      fetchEmployees()
    }
  }, [open])

  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true)
      const res = await api.get("/employees?limit=100")
      const list = res.data?.data || []
      setEmployees(list)
      if (list.length > 0) {
        setEmployeeId(list[0].id)
      }
    } catch (err) {
      console.error("Failed to load employees:", err)
    } finally {
      setLoadingEmployees(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError("")

    if (!employeeId) {
      setApiError("Please select an employee.")
      return
    }

    setSubmitting(true)

    try {
      await api.post(`/licenses/${license.id}/allocate`, {
        assetId: license.id,
        employeeId,
        notes,
      })
      toast.success("✓ License allocated successfully.")
      onSuccess?.()
      onOpenChange(false)
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to allocate license seat."
      setApiError(msg)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">
            Allocate Seat: {license?.brand} {license?.model}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Assign one available license seat to an employee.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {apiError && (
            <Alert variant="destructive" className="py-2.5 px-3 text-xs">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="ml-2 font-medium">{apiError}</AlertDescription>
            </Alert>
          )}

          <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Available Quota:</span>
              <span className="font-bold text-foreground">
                {license?.availableSeats ?? (license?.seatQuota - (license?.allocatedSeats || 0))} / {license?.seatQuota} Seats
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">License Key:</span>
              <span className="font-mono text-[11px] font-medium text-foreground truncate max-w-[220px]">
                {license?.licenseKey || "Standard Managed"}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="employee" className="text-xs font-medium">
              Employee <span className="text-destructive">*</span>
            </Label>
            {loadingEmployees ? (
              <p className="text-xs text-muted-foreground">Loading employee roster...</p>
            ) : (
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger id="employee" className="text-xs">
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
            <Label htmlFor="notes" className="text-xs font-medium">
              Allocation Notes / Project
            </Label>
            <Input
              id="notes"
              placeholder="e.g. Core development IDE seat"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs"
            />
          </div>

          <DialogFooter className="pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting || (license?.availableSeats <= 0)}
              className="text-xs"
            >
              {submitting ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Allocating...
                </span>
              ) : (
                "Allocate Seat"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
