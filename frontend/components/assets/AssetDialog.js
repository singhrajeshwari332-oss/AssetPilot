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

const CATEGORIES = [
  { value: "LAPTOP", label: "Laptop" },
  { value: "MONITOR", label: "Monitor" },
  { value: "MOBILE_DEVICE", label: "Mobile Device" },
  { value: "PERIPHERAL", label: "Peripheral" },
  { value: "SOFTWARE_LICENSE", label: "Software License" },
]

export function AssetDialog({ open, onOpenChange, asset, onSuccess }) {
  const isEditing = Boolean(asset?.id)

  const [formData, setFormData] = useState({
    assetTag: "",
    category: "LAPTOP",
    brand: "",
    model: "",
    serialNumber: "",
    purchaseDate: "",
    purchaseCost: "",
    location: "HQ Floor 1",
    notes: "",
    licenseKey: "",
    seatQuota: "1",
    costPerSeat: "0",
    expirationDate: "",
  })

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState("")

  useEffect(() => {
    if (asset) {
      setFormData({
        assetTag: asset.assetTag || "",
        category: asset.category || "LAPTOP",
        brand: asset.brand || "",
        model: asset.model || "",
        serialNumber: asset.serialNumber || "",
        purchaseDate: asset.purchaseDate ? asset.purchaseDate.split("T")[0] : "",
        purchaseCost: asset.purchaseCost !== undefined ? String(asset.purchaseCost) : "",
        location: asset.location || "HQ Floor 1",
        notes: asset.notes || "",
        licenseKey: asset.licenseKey || "",
        seatQuota: asset.seatQuota !== undefined ? String(asset.seatQuota) : "1",
        costPerSeat: asset.costPerSeat !== undefined ? String(asset.costPerSeat) : "0",
        expirationDate: asset.expirationDate ? asset.expirationDate.split("T")[0] : "",
      })
    } else {
      setFormData({
        assetTag: "",
        category: "LAPTOP",
        brand: "",
        model: "",
        serialNumber: "",
        purchaseDate: new Date().toISOString().split("T")[0],
        purchaseCost: "",
        location: "HQ Floor 1",
        notes: "",
        licenseKey: "",
        seatQuota: "1",
        costPerSeat: "0",
        expirationDate: "",
      })
    }
    setErrors({})
    setApiError("")
  }, [asset, open])

  const validate = () => {
    const newErrors = {}

    if (!formData.assetTag.trim()) {
      newErrors.assetTag = "Asset tag is required."
    }
    if (!formData.brand.trim()) {
      newErrors.brand = "Brand is required."
    }
    if (!formData.model.trim()) {
      newErrors.model = "Model is required."
    }

    if (formData.category === "SOFTWARE_LICENSE") {
      if (formData.seatQuota && parseInt(formData.seatQuota, 10) <= 0) {
        newErrors.seatQuota = "Seat quota must be at least 1."
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError("")

    if (!validate()) return

    setLoading(true)

    try {
      if (isEditing) {
        await api.put(`/assets/${asset.id}`, formData)
        toast.success("Asset updated successfully.")
      } else {
        await api.post("/assets", formData)
        toast.success("Asset created successfully.")
      }

      onSuccess?.()
      onOpenChange(false)
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to save asset."
      setApiError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {isEditing ? `Edit Asset: ${asset?.assetTag}` : "Register New Asset"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {isEditing
              ? "Update asset metadata and hardware specifications."
              : "Add a new device or software license to the central registry."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {apiError && (
            <Alert variant="destructive" className="py-2.5 px-3 text-xs">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="ml-2 font-medium">{apiError}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Asset Tag */}
            <div className="space-y-1.5">
              <Label htmlFor="assetTag" className="text-xs font-medium">
                Asset Tag <span className="text-destructive">*</span>
              </Label>
              <Input
                id="assetTag"
                placeholder="e.g. LAP-009, MON-012"
                value={formData.assetTag}
                onChange={(e) => setFormData({ ...formData, assetTag: e.target.value.toUpperCase() })}
                disabled={isEditing || loading}
                className={`font-mono text-xs ${errors.assetTag ? "border-destructive" : ""}`}
              />
              {errors.assetTag && <p className="text-[11px] text-destructive">{errors.assetTag}</p>}
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label htmlFor="category" className="text-xs font-medium">
                Category <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.category}
                onValueChange={(val) => setFormData({ ...formData, category: val })}
                disabled={isEditing || loading}
              >
                <SelectTrigger id="category" className="text-xs">
                  <SelectValue placeholder="Select Category" />
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

            {/* Brand */}
            <div className="space-y-1.5">
              <Label htmlFor="brand" className="text-xs font-medium">
                Brand / Manufacturer <span className="text-destructive">*</span>
              </Label>
              <Input
                id="brand"
                placeholder="e.g. Apple, Dell, Lenovo, JetBrains"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                disabled={loading}
                className={`text-xs ${errors.brand ? "border-destructive" : ""}`}
              />
              {errors.brand && <p className="text-[11px] text-destructive">{errors.brand}</p>}
            </div>

            {/* Model */}
            <div className="space-y-1.5">
              <Label htmlFor="model" className="text-xs font-medium">
                Model Name / Description <span className="text-destructive">*</span>
              </Label>
              <Input
                id="model"
                placeholder="e.g. MacBook Pro 16 M3 Max"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                disabled={loading}
                className={`text-xs ${errors.model ? "border-destructive" : ""}`}
              />
              {errors.model && <p className="text-[11px] text-destructive">{errors.model}</p>}
            </div>

            {/* Serial Number */}
            <div className="space-y-1.5">
              <Label htmlFor="serialNumber" className="text-xs font-medium">
                Serial Number
              </Label>
              <Input
                id="serialNumber"
                placeholder="Hardware S/N"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                disabled={loading}
                className="font-mono text-xs"
              />
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <Label htmlFor="location" className="text-xs font-medium">
                Storage / Physical Location
              </Label>
              <Input
                id="location"
                placeholder="e.g. Floor 3 - Engineering Bay"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                disabled={loading}
                className="text-xs"
              />
            </div>

            {/* Purchase Date */}
            <div className="space-y-1.5">
              <Label htmlFor="purchaseDate" className="text-xs font-medium">
                Purchase Date
              </Label>
              <Input
                id="purchaseDate"
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                disabled={loading}
                className="text-xs"
              />
            </div>

            {/* Purchase Cost */}
            <div className="space-y-1.5">
              <Label htmlFor="purchaseCost" className="text-xs font-medium">
                Purchase Cost (₹ INR)
              </Label>
              <Input
                id="purchaseCost"
                type="number"
                placeholder="e.g. 150000"
                value={formData.purchaseCost}
                onChange={(e) => setFormData({ ...formData, purchaseCost: e.target.value })}
                disabled={loading}
                className="text-xs"
              />
            </div>
          </div>

          {/* Software License Specific Fields */}
          {formData.category === "SOFTWARE_LICENSE" && (
            <div className="border-t pt-4 mt-2 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Software License Parameters
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="licenseKey" className="text-xs font-medium">
                    License Key / Activation Secret
                  </Label>
                  <Input
                    id="licenseKey"
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    value={formData.licenseKey}
                    onChange={(e) => setFormData({ ...formData, licenseKey: e.target.value })}
                    disabled={loading}
                    className="font-mono text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="seatQuota" className="text-xs font-medium">
                    Seat Quota (Total Seats)
                  </Label>
                  <Input
                    id="seatQuota"
                    type="number"
                    min="1"
                    value={formData.seatQuota}
                    onChange={(e) => setFormData({ ...formData, seatQuota: e.target.value })}
                    disabled={loading}
                    className="text-xs"
                  />
                  {errors.seatQuota && <p className="text-[11px] text-destructive">{errors.seatQuota}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="costPerSeat" className="text-xs font-medium">
                    Cost Per Seat (₹ INR)
                  </Label>
                  <Input
                    id="costPerSeat"
                    type="number"
                    value={formData.costPerSeat}
                    onChange={(e) => setFormData({ ...formData, costPerSeat: e.target.value })}
                    disabled={loading}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="expirationDate" className="text-xs font-medium">
                    License Expiration Date
                  </Label>
                  <Input
                    id="expirationDate"
                    type="date"
                    value={formData.expirationDate}
                    onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                    disabled={loading}
                    className="text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5 border-t pt-3">
            <Label htmlFor="notes" className="text-xs font-medium">
              Notes & Technical Specs
            </Label>
            <textarea
              id="notes"
              rows={3}
              placeholder="e.g. 32GB RAM, 1TB NVMe SSD, Includes power adapter"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              disabled={loading}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

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
            <Button type="submit" size="sm" disabled={loading} className="text-xs">
              {loading ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </span>
              ) : isEditing ? (
                "Update Asset"
              ) : (
                "Create Asset"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
