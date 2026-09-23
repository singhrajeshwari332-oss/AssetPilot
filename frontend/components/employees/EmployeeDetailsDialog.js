"use client"

import React, { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatDate } from "@/lib/utils"
import api from "@/services/api"
import { toast } from "sonner"
import {
  User as UserIcon,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Briefcase,
  Building,
  Laptop,
  KeyRound,
  ClipboardList,
  Download,
  Loader2,
  ShieldCheck,
  Wrench,
  Eye,
} from "lucide-react"

export function EmployeeDetailsDialog({
  open,
  onOpenChange,
  employee,
}) {
  const [details, setDetails] = useState(employee || null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !employee?.id) return

    setLoading(true)

    api
      .get(`/employees/${employee.id}`)
      .then((res) => {
        setDetails(res.data?.employee || res.data)
      })
      .catch((error) => {
        console.error("Failed to load employee details:", error)
        toast.error("Failed to load employee details.")
        setDetails(employee)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [open, employee])

  if (!details) return null

  const assets = details.custodyRecords || []
  const licenses = details.licenseAllocations || []
  const requests = details.returnRequests || []

  const activeAssets = assets.filter(
    (record) => !record.checkinDate
  )

  const activeLicenses = licenses.filter(
    (license) => !license.revokedAt
  )

  const getStatusVariant = (status) => {
    switch (status) {
      case "ACTIVE":
      case "AVAILABLE":
      case "ASSIGNED":
        return "default"

      case "IN_REPAIR":
      case "RETURN_REQUESTED":
        return "secondary"

      case "RETIRED":
      case "INACTIVE":
        return "destructive"

      default:
        return "outline"
    }
  }

  const getAssetStatus = (asset) => {
    if (!asset) return "UNKNOWN"

    return asset.status || "UNKNOWN"
  }

  const exportCSV = () => {
    if (!details) return

    const rows = []

    rows.push([
      "Employee Information",
      "",
    ])

    rows.push(["Employee ID", details.employeeId || ""])
    rows.push(["Name", details.name || ""])
    rows.push(["Email", details.email || ""])
    rows.push(["Department", details.department || ""])
    rows.push(["Designation", details.designation || ""])
    rows.push(["Manager", details.manager || ""])
    rows.push(["Employment Type", details.employmentType || ""])
    rows.push(["Employment Status", details.employmentStatus || ""])
    rows.push(["Work Location", details.workLocation || ""])
    rows.push(["Join Date", details.joinDate ? formatDate(details.joinDate) : ""])
    rows.push(["Exit Date", details.exitDate ? formatDate(details.exitDate) : ""])

    rows.push([])
    rows.push(["Personal Information", ""])
    rows.push(["Date of Birth", details.dob ? formatDate(details.dob) : ""])
    rows.push(["Gender", details.gender || ""])
    rows.push(["Blood Group", details.bloodGroup || ""])

    rows.push([])
    rows.push(["Contact Information", ""])
    rows.push(["Phone", details.phone || ""])
    rows.push(["Email", details.email || ""])
    rows.push(["Address", details.address || ""])

    rows.push([])
    rows.push(["Assigned Assets", ""])

    rows.push([
      "Asset Tag",
      "Asset Name",
      "Category",
      "Serial Number",
      "Status",
      "Checkout Date",
      "Checkin Date",
      "Condition",
    ])

    activeAssets.forEach((record) => {
      const asset = record.asset || {}

      rows.push([
        asset.assetTag || "",
        asset.name || asset.model || "",
        asset.category || "",
        asset.serialNumber || "",
        asset.status || "",
        record.checkoutDate
          ? formatDate(record.checkoutDate)
          : "",
        record.checkinDate
          ? formatDate(record.checkinDate)
          : "",
        record.condition || "",
      ])
    })

    rows.push([])
    rows.push(["Software Licenses", ""])

    rows.push([
      "License",
      "License Key",
      "Allocated Date",
      "Expiry Date",
      "Status",
    ])

    activeLicenses.forEach((license) => {
      const asset = license.asset || {}

      rows.push([
        asset.name || license.licenseName || "",
        license.licenseKey || "",
        license.allocatedAt
          ? formatDate(license.allocatedAt)
          : "",
        license.expiresAt
          ? formatDate(license.expiresAt)
          : "",
        license.revokedAt ? "REVOKED" : "ACTIVE",
      ])
    })

    rows.push([])
    rows.push(["Asset Requests", ""])

    rows.push([
      "Asset",
      "Request Type",
      "Status",
      "Requested Date",
      "Processed Date",
      "Reason",
    ])

    requests.forEach((request) => {
      const asset = request.asset || {}

      rows.push([
        asset.assetTag || asset.name || "",
        request.requestType || "RETURN",
        request.status || "",
        request.requestedAt
          ? formatDate(request.requestedAt)
          : "",
        request.processedAt
          ? formatDate(request.processedAt)
          : "",
        request.reason || "",
      ])
    })

    const csv = rows
      .map((row) =>
        row
          .map((value) => {
            const text = String(value ?? "")
            return `"${text.replace(/"/g, '""')}"`
          })
          .join(",")
      )
      .join("\n")

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    })

    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.download = `${(details.name || "Employee")
      .replace(/\s+/g, "_")}_Employee_Report.csv`

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)

    toast.success("Employee report exported successfully.")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl p-0">
        <div className="max-h-[85vh] overflow-y-auto">

          {/* Header */}
          <DialogHeader className="border-b px-6 py-5">
            <div className="flex items-start justify-between gap-4 pr-8">
              <div className="flex items-center gap-4">

                {/* Profile Photo */}
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted">
                  {details.profilePhoto ? (
                    <img
                      src={details.profilePhoto}
                      alt={details.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserIcon className="h-9 w-9 text-muted-foreground" />
                  )}
                </div>

                <div>
                  <DialogTitle className="text-2xl font-semibold">
                    {details.name}
                  </DialogTitle>

                  <div className="mt-1 text-sm text-muted-foreground">
                    {details.employeeId}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant="outline">
                      {details.designation || "Employee"}
                    </Badge>

                    {details.department && (
                      <Badge variant="secondary">
                        {details.department}
                      </Badge>
                    )}

                    <Badge
                      variant={getStatusVariant(
                        details.employmentStatus
                      )}
                    >
                      {details.employmentStatus || "ACTIVE"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading employee details...
            </div>
          ) : (
            <div className="space-y-6 px-6 py-6">

              {/* Summary */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Laptop className="h-4 w-4" />
                    Assigned Assets
                  </div>

                  <div className="mt-2 text-2xl font-semibold">
                    {activeAssets.length}
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <KeyRound className="h-4 w-4" />
                    Software Licenses
                  </div>

                  <div className="mt-2 text-2xl font-semibold">
                    {activeLicenses.length}
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ClipboardList className="h-4 w-4" />
                    Asset Requests
                  </div>

                  <div className="mt-2 text-2xl font-semibold">
                    {requests.length}
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <section>
                <div className="mb-4 flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">
                    Personal Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-4 rounded-lg border p-5 md:grid-cols-3">

                  <InfoItem
                    label="Full Name"
                    value={details.name}
                  />

                  <InfoItem
                    label="Date of Birth"
                    value={
                      details.dob
                        ? formatDate(details.dob)
                        : "Not provided"
                    }
                  />

                  <InfoItem
                    label="Gender"
                    value={details.gender || "Not provided"}
                  />

                  <InfoItem
                    label="Blood Group"
                    value={details.bloodGroup || "Not provided"}
                  />

                </div>
              </section>

              <Separator />

              {/* Contact Information */}
              <section>
                <div className="mb-4 flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">
                    Contact Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-4 rounded-lg border p-5 md:grid-cols-2">

                  <InfoItem
                    label="Email"
                    value={details.email}
                    icon={<Mail className="h-4 w-4" />}
                  />

                  <InfoItem
                    label="Phone"
                    value={details.phone || "Not provided"}
                    icon={<Phone className="h-4 w-4" />}
                  />

                  <InfoItem
                    label="Address"
                    value={details.address || "Not provided"}
                    icon={<MapPin className="h-4 w-4" />}
                  />

                </div>
              </section>

              <Separator />

              {/* Work Information */}
              <section>
                <div className="mb-4 flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">
                    Work Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-4 rounded-lg border p-5 md:grid-cols-3">

                  <InfoItem
                    label="Employee ID"
                    value={details.employeeId}
                  />

                  <InfoItem
                    label="Department"
                    value={details.department}
                    icon={<Building className="h-4 w-4" />}
                  />

                  <InfoItem
                    label="Designation"
                    value={details.designation}
                  />

                  <InfoItem
                    label="Manager"
                    value={details.manager || "Not assigned"}
                  />

                  <InfoItem
                    label="Employment Type"
                    value={
                      details.employmentType || "Not provided"
                    }
                  />

                  <InfoItem
                    label="Work Location"
                    value={
                      details.workLocation || "Not provided"
                    }
                  />

                  <InfoItem
                    label="Employment Status"
                    value={
                      details.employmentStatus || "ACTIVE"
                    }
                  />

                  <InfoItem
                    label="Join Date"
                    value={
                      details.joinDate
                        ? formatDate(details.joinDate)
                        : "Not provided"
                    }
                    icon={<Calendar className="h-4 w-4" />}
                  />

                  <InfoItem
                    label="Exit Date"
                    value={
                      details.exitDate
                        ? formatDate(details.exitDate)
                        : "Not applicable"
                    }
                  />

                </div>
              </section>

              <Separator />

              {/* My Assets */}
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Laptop className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">
                      My Assets
                    </h3>
                  </div>

                  <Badge variant="outline">
                    {activeAssets.length} Active
                  </Badge>
                </div>

                {activeAssets.length === 0 ? (
                  <EmptySection text="No assets currently assigned." />
                ) : (
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left">
                            Asset Tag
                          </th>
                          <th className="px-4 py-3 text-left">
                            Asset
                          </th>
                          <th className="px-4 py-3 text-left">
                            Category
                          </th>
                          <th className="px-4 py-3 text-left">
                            Serial Number
                          </th>
                          <th className="px-4 py-3 text-left">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left">
                            Assigned Date
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {activeAssets.map((record) => {
                          const asset = record.asset || {}

                          return (
                            <tr
                              key={record.id}
                              className="border-t"
                            >
                              <td className="px-4 py-3 font-medium">
                                {asset.assetTag || "—"}
                              </td>

                              <td className="px-4 py-3">
                                {asset.name ||
                                  asset.model ||
                                  "—"}
                              </td>

                              <td className="px-4 py-3">
                                {asset.category || "—"}
                              </td>

                              <td className="px-4 py-3">
                                {asset.serialNumber || "—"}
                              </td>

                              <td className="px-4 py-3">
                                <Badge
                                  variant={getStatusVariant(
                                    getAssetStatus(asset)
                                  )}
                                >
                                  {getAssetStatus(asset)}
                                </Badge>
                              </td>

                              <td className="px-4 py-3">
                                {record.checkoutDate
                                  ? formatDate(
                                      record.checkoutDate
                                    )
                                  : "—"}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <Separator />

              {/* Software Licenses */}
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">
                      Software Licenses
                    </h3>
                  </div>

                  <Badge variant="outline">
                    {activeLicenses.length} Active
                  </Badge>
                </div>

                {activeLicenses.length === 0 ? (
                  <EmptySection text="No active software licenses assigned." />
                ) : (
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left">
                            Software
                          </th>
                          <th className="px-4 py-3 text-left">
                            License Key
                          </th>
                          <th className="px-4 py-3 text-left">
                            Allocated
                          </th>
                          <th className="px-4 py-3 text-left">
                            Expiry
                          </th>
                          <th className="px-4 py-3 text-left">
                            Status
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {activeLicenses.map((license) => {
                          const asset = license.asset || {}

                          return (
                            <tr
                              key={license.id}
                              className="border-t"
                            >
                              <td className="px-4 py-3 font-medium">
                                {asset.name ||
                                  license.licenseName ||
                                  "—"}
                              </td>

                              <td className="px-4 py-3">
                                {license.licenseKey || "—"}
                              </td>

                              <td className="px-4 py-3">
                                {license.allocatedAt
                                  ? formatDate(
                                      license.allocatedAt
                                    )
                                  : "—"}
                              </td>

                              <td className="px-4 py-3">
                                {license.expiresAt
                                  ? formatDate(
                                      license.expiresAt
                                    )
                                  : "—"}
                              </td>

                              <td className="px-4 py-3">
                                <Badge>
                                  {license.revokedAt
                                    ? "REVOKED"
                                    : "ACTIVE"}
                                </Badge>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <Separator />

              {/* Asset Requests */}
              <section>
                <div className="mb-4 flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">
                    Asset Requests
                  </h3>
                </div>

                {requests.length === 0 ? (
                  <EmptySection text="No asset requests found." />
                ) : (
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left">
                            Asset
                          </th>
                          <th className="px-4 py-3 text-left">
                            Type
                          </th>
                          <th className="px-4 py-3 text-left">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left">
                            Requested
                          </th>
                          <th className="px-4 py-3 text-left">
                            Reason
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {requests.map((request) => {
                          const asset = request.asset || {}

                          return (
                            <tr
                              key={request.id}
                              className="border-t"
                            >
                              <td className="px-4 py-3 font-medium">
                                {asset.assetTag ||
                                  asset.name ||
                                  "—"}
                              </td>

                              <td className="px-4 py-3">
                                {request.requestType ||
                                  "RETURN"}
                              </td>

                              <td className="px-4 py-3">
                                <Badge
                                  variant={getStatusVariant(
                                    request.status
                                  )}
                                >
                                  {request.status || "PENDING"}
                                </Badge>
                              </td>

                              <td className="px-4 py-3">
                                {request.requestedAt
                                  ? formatDate(
                                      request.requestedAt
                                    )
                                  : "—"}
                              </td>

                              <td className="px-4 py-3">
                                {request.reason || "—"}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* Footer Actions */}
              <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:justify-end">

                <Button
                  variant="outline"
                  onClick={exportCSV}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>

                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>

              </div>

            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function InfoItem({
  label,
  value,
  icon,
}) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </div>

      <div className="break-words text-sm font-medium">
        {value || "Not provided"}
      </div>
    </div>
  )
}

function EmptySection({ text }) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  )
}