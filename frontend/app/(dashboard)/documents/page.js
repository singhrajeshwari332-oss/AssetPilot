"use client"

import { useEffect, useMemo, useState } from "react"
import {
  FileText,
  Search,
  RefreshCw,
  Plus,
  Clock3,
  PenLine,
  CheckCircle2,
  XCircle,
  Eye,
  Download,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

import { StatusBadge } from "@/components/common/StatusBadge"
import { formatDateTime } from "@/lib/utils"
import api from "@/services/api"
import { useAuth } from "@/context/AuthContext"

export default function DocumentsPage() {
  const { user } = useAuth()

  const [documents, setDocuments] = useState([])
  const [employees, setEmployees] = useState([])
  const [assets, setAssets] = useState([])

  const [loading, setLoading] = useState(true)
  const [employeesLoading, setEmployeesLoading] = useState(false)
  const [assetsLoading, setAssetsLoading] = useState(false)
  const [creating, setCreating] = useState(false)

  const [search, setSearch] = useState("")
  const [createOpen, setCreateOpen] = useState(false)

  const [selectedEmployee, setSelectedEmployee] = useState("")
  const [selectedAsset, setSelectedAsset] = useState("")

  const [employeeSearch, setEmployeeSearch] = useState("")
  const [assetSearch, setAssetSearch] = useState("")

  const [selectedDocument, setSelectedDocument] = useState(null)
  const [viewOpen, setViewOpen] = useState(false)

  const [downloadingId, setDownloadingId] = useState(null)

  const [signingId, setSigningId] = useState(null)
  const [signDocument, setSignDocument] = useState(null)
  const [signOpen, setSignOpen] = useState(false)

  const isAdmin = user?.role === "SUPER_ADMIN"

  const fetchDocuments = async () => {
    try {
      setLoading(true)

      const res = await api.get("/handover-documents")

      setDocuments(res.data || [])
    } catch (error) {
      console.error("Failed to load documents:", error)
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployees = async () => {
    try {
      setEmployeesLoading(true)

      const res = await api.get("/employees")

      const employeeData = Array.isArray(res.data)
        ? res.data
        : res.data?.employees || res.data?.data || []

      setEmployees(employeeData)
    } catch (error) {
      console.error("Failed to load employees:", error)
      setEmployees([])
    } finally {
      setEmployeesLoading(false)
    }
  }

  const fetchAssets = async () => {
    try {
      setAssetsLoading(true)

      const res = await api.get("/assets")

      const assetData = Array.isArray(res.data)
        ? res.data
        : res.data?.assets || res.data?.data || []

      setAssets(assetData)
    } catch (error) {
      console.error("Failed to load assets:", error)
      setAssets([])
    } finally {
      setAssetsLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchDocuments()
    }
  }, [user])

  useEffect(() => {
    if (createOpen && isAdmin) {
      fetchEmployees()
      fetchAssets()
    }
  }, [createOpen, isAdmin])

  useEffect(() => {
    setSelectedAsset("")
    setAssetSearch("")
  }, [selectedEmployee])

  const employeeAssets = useMemo(() => {
    if (!selectedEmployee) return []

    return assets.filter(
      (asset) => asset.currentEmployee?.id === selectedEmployee
    )
  }, [assets, selectedEmployee])

  const filteredEmployees = useMemo(() => {
    const value = employeeSearch.toLowerCase().trim()

    if (!value) return employees

    return employees.filter((employee) => {
      return (
        employee.name?.toLowerCase().includes(value) ||
        employee.employeeId?.toLowerCase().includes(value) ||
        employee.department?.toLowerCase().includes(value)
      )
    })
  }, [employees, employeeSearch])

  const filteredEmployeeAssets = useMemo(() => {
    const value = assetSearch.toLowerCase().trim()

    if (!value) return employeeAssets

    return employeeAssets.filter((asset) => {
      return (
        asset.assetTag?.toLowerCase().includes(value) ||
        asset.assetId?.toLowerCase().includes(value) ||
        asset.model?.toLowerCase().includes(value) ||
        asset.category?.toLowerCase().includes(value) ||
        asset.serialNumber?.toLowerCase().includes(value) ||
        asset.serial?.toLowerCase().includes(value)
      )
    })
  }, [employeeAssets, assetSearch])

  const summary = useMemo(() => {
    return {
      total: documents.length,

      pendingEmployee: documents.filter(
        (doc) => doc.status === "PENDING_EMPLOYEE_SIGNATURE"
      ).length,

      pendingAdmin: documents.filter(
        (doc) => doc.status === "PENDING_ADMIN_SIGNATURE"
      ).length,

      completed: documents.filter(
        (doc) => doc.status === "COMPLETED"
      ).length,

      cancelled: documents.filter(
        (doc) => doc.status === "CANCELLED"
      ).length,
    }
  }, [documents])

  const filteredDocuments = useMemo(() => {
    const value = search.toLowerCase().trim()

    if (!value) return documents

    return documents.filter((doc) => {
      return (
        doc.documentId?.toLowerCase().includes(value) ||
        doc.documentType?.toLowerCase().includes(value) ||
        doc.status?.toLowerCase().includes(value) ||
        doc.employee?.name?.toLowerCase().includes(value) ||
        doc.employee?.employeeId?.toLowerCase().includes(value) ||
        doc.asset?.assetTag?.toLowerCase().includes(value) ||
        doc.asset?.assetId?.toLowerCase().includes(value)
      )
    })
  }, [documents, search])

  const selectedEmployeeData = employees.find(
    (employee) => employee.id === selectedEmployee
  )

  const selectedAssetData = assets.find(
    (asset) => asset.id === selectedAsset
  )

  const handleCloseDialog = (open) => {
    setCreateOpen(open)

    if (!open) {
      setSelectedEmployee("")
      setSelectedAsset("")
      setEmployeeSearch("")
      setAssetSearch("")
    }
  }

  const handleEmployeeSelect = (employeeId) => {
    setSelectedEmployee(employeeId)
    setSelectedAsset("")
    setAssetSearch("")
  }

  const handleAssetSelect = (assetId) => {
    setSelectedAsset(assetId)
  }

  const handleViewDocument = (document) => {
    setSelectedDocument(document)
    setViewOpen(true)
  }

  const handleDownloadPdf = async (document) => {
    if (!document?.id) return

    try {
      setDownloadingId(document.id)

      const response = await api.get(
        `/handover-documents/${document.id}/pdf`,
        {
          responseType: "blob",
        }
      )

      const blob = new Blob([response.data], {
        type: "application/pdf",
      })

      const url = window.URL.createObjectURL(blob)

      const link = window.document.createElement("a")
      link.href = url
      link.download = `${document.documentId || "handover-document"}.pdf`

      window.document.body.appendChild(link)
      link.click()
      link.remove()

      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Failed to download PDF:", error)
    } finally {
      setDownloadingId(null)
    }
  }

  const handleSignDocument = async () => {
    if (!signDocument?.id) return

    try {
      setSigningId(signDocument.id)

      const endpoint =
        signDocument.status === "PENDING_EMPLOYEE_SIGNATURE"
          ? `/handover-documents/${signDocument.id}/employee-sign`
          : `/handover-documents/${signDocument.id}/admin-sign`

      await api.post(endpoint)

      setSignOpen(false)
      setSignDocument(null)

      await fetchDocuments()
    } catch (error) {
      console.error("Failed to sign document:", error)
    } finally {
      setSigningId(null)
    }
  }

  const handleCreateHandover = async () => {
    if (!selectedEmployee || !selectedAsset) {
      return
    }

    try {
      setCreating(true)

      const custodyRecord =
        selectedAssetData?.custodyRecords?.find(
          (record) => record.employeeId === selectedEmployee
        ) || selectedAssetData?.custodyRecords?.[0]

      if (!custodyRecord?.id) {
        return
      }

      const response = await api.post("/handover-documents", {
        custodyRecordId: custodyRecord.id,
        employeeId: selectedEmployee,
        assetId: selectedAsset,
        documentType: "HANDOVER",
      })

      console.log(
        "Handover created successfully:",
        response.data
      )

      handleCloseDialog(false)

      await fetchDocuments()
    } catch (error) {
      console.error(
        "Failed to create handover document:",
        error
      )

      console.error(
        "Backend response:",
        error?.response?.data
      )
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Documents
          </h1>

          <p className="text-xs text-muted-foreground mt-0.5">
            Digital handover and return document management.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDocuments}
            disabled={loading}
            className="h-8 gap-1.5 text-xs"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${
                loading ? "animate-spin" : ""
              }`}
            />

            Refresh
          </Button>

          {isAdmin && (
            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />

              Create Handover
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <SummaryCard
          title="Total Documents"
          value={summary.total}
          icon={FileText}
        />

        <SummaryCard
          title="Employee Signature"
          value={summary.pendingEmployee}
          icon={Clock3}
        />

        <SummaryCard
          title="Admin Signature"
          value={summary.pendingAdmin}
          icon={PenLine}
        />

        <SummaryCard
          title="Completed"
          value={summary.completed}
          icon={CheckCircle2}
        />

        <SummaryCard
          title="Cancelled"
          value={summary.cancelled}
          icon={XCircle}
        />
      </div>

      {/* Documents Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />

                Handover & Return Documents
              </CardTitle>

              <p className="text-xs text-muted-foreground mt-1">
                {isAdmin
                  ? "Official employee asset custody documents."
                  : "Your official asset custody documents."}
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />

              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search documents..."
                className="h-8 pl-8 text-xs"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-3" />

              <p className="text-sm font-medium">
                {search
                  ? "No matching documents"
                  : "No documents found"}
              </p>

              <p className="text-xs text-muted-foreground mt-1">
                {search
                  ? "Try a different search term."
                  : "Handover and return documents will appear here."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDocuments.map((document) => (
                <div
                  key={document.id}
                  className="rounded-lg border p-4 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm font-mono">
                          {document.documentId}
                        </p>

                        <StatusBadge status={document.status} />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2 mt-3">
                        <InfoItem
                          label="Type"
                          value={document.documentType}
                        />

                        <InfoItem
                          label="Employee"
                          value={
                            document.employee?.name ||
                            document.employee?.employeeId ||
                            "-"
                          }
                        />

                        <InfoItem
                          label="Asset"
                          value={
                            document.asset?.assetTag ||
                            document.asset?.assetId ||
                            "-"
                          }
                        />

                        <InfoItem
                          label="Created"
                          value={formatDateTime(document.createdAt)}
                        />

                        <InfoItem
                          label="Employee Signed"
                          value={
                            document.employeeSignedAt
                              ? formatDateTime(
                                  document.employeeSignedAt
                                )
                              : "Pending"
                          }
                        />

                        <InfoItem
                          label="Admin Signed"
                          value={
                            document.adminSignedAt
                              ? formatDateTime(
                                  document.adminSignedAt
                                )
                              : "Pending"
                          }
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-xs"
                        onClick={() =>
                          handleViewDocument(document)
                        }
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Button>

                      {/* Employee Sign */}
                      {document.status ===
                        "PENDING_EMPLOYEE_SIGNATURE" &&
                        user?.role === "EMPLOYEE" &&
                        document.employeeId === user?.employeeId && (
                          <Button
                            size="sm"
                            className="h-8 gap-1.5 text-xs"
                            onClick={() => {
                              setSignDocument(document)
                              setSignOpen(true)
                            }}
                          >
                            <PenLine className="h-3.5 w-3.5" />
                            Sign
                          </Button>
                        )}

                      {/* SUPER_ADMIN Sign */}
                      {document.status ===
                        "PENDING_ADMIN_SIGNATURE" &&
                        user?.role === "SUPER_ADMIN" && (
                          <Button
                            size="sm"
                            className="h-8 gap-1.5 text-xs"
                            onClick={() => {
                              setSignDocument(document)
                              setSignOpen(true)
                            }}
                          >
                            <PenLine className="h-3.5 w-3.5" />
                            Sign
                          </Button>
                        )}

                      {/* Download completed document */}
                      {document.status === "COMPLETED" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 text-xs"
                          onClick={() =>
                            handleDownloadPdf(document)
                          }
                          disabled={
                            downloadingId === document.id
                          }
                        >
                          <Download
                            className={`h-3.5 w-3.5 ${
                              downloadingId === document.id
                                ? "animate-pulse"
                                : ""
                            }`}
                          />

                          {downloadingId === document.id
                            ? "Downloading..."
                            : "Download PDF"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Document Dialog */}
      <Dialog
        open={viewOpen}
        onOpenChange={setViewOpen}
      >
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />

              {selectedDocument?.documentId ||
                "Document Details"}
            </DialogTitle>

            <DialogDescription>
              Digital asset handover and custody document details.
            </DialogDescription>
          </DialogHeader>

          {selectedDocument && (
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="space-y-5 py-4">
                <div className="rounded-lg border bg-muted/20 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Document ID
                      </p>

                      <p className="text-sm font-semibold font-mono mt-1">
                        {selectedDocument.documentId}
                      </p>
                    </div>

                    <StatusBadge
                      status={selectedDocument.status}
                    />
                  </div>
                </div>

                <DocumentSection title="Document Information">
                  <InfoItem
                    label="Document Type"
                    value={
                      selectedDocument.documentType || "-"
                    }
                  />

                  <InfoItem
                    label="Status"
                    value={
                      selectedDocument.status || "-"
                    }
                  />

                  <InfoItem
                    label="Created"
                    value={
                      selectedDocument.createdAt
                        ? formatDateTime(
                            selectedDocument.createdAt
                          )
                        : "-"
                    }
                  />

                  <InfoItem
                    label="Updated"
                    value={
                      selectedDocument.updatedAt
                        ? formatDateTime(
                            selectedDocument.updatedAt
                          )
                        : "-"
                    }
                  />
                </DocumentSection>

                <DocumentSection title="Employee Information">
                  <InfoItem
                    label="Employee Name"
                    value={
                      selectedDocument.employee?.name || "-"
                    }
                  />

                  <InfoItem
                    label="Employee ID"
                    value={
                      selectedDocument.employee?.employeeId ||
                      "-"
                    }
                  />

                  <InfoItem
                    label="Department"
                    value={
                      selectedDocument.employee?.department ||
                      "-"
                    }
                  />

                  <InfoItem
                    label="Designation"
                    value={
                      selectedDocument.employee?.designation ||
                      "-"
                    }
                  />

                  <InfoItem
                    label="Email"
                    value={
                      selectedDocument.employee?.email || "-"
                    }
                  />

                  <InfoItem
                    label="Phone"
                    value={
                      selectedDocument.employee?.phone || "-"
                    }
                  />
                </DocumentSection>

                <DocumentSection title="Asset Information">
                  <InfoItem
                    label="Asset Tag"
                    value={
                      selectedDocument.asset?.assetTag ||
                      selectedDocument.asset?.assetId ||
                      "-"
                    }
                  />

                  <InfoItem
                    label="Category"
                    value={
                      selectedDocument.asset?.category || "-"
                    }
                  />

                  <InfoItem
                    label="Brand"
                    value={
                      selectedDocument.asset?.brand || "-"
                    }
                  />

                  <InfoItem
                    label="Model"
                    value={
                      selectedDocument.asset?.model || "-"
                    }
                  />

                  <InfoItem
                    label="Serial Number"
                    value={
                      selectedDocument.asset?.serialNumber ||
                      selectedDocument.asset?.serial ||
                      "-"
                    }
                  />

                  <InfoItem
                    label="Asset Status"
                    value={
                      selectedDocument.asset?.status || "-"
                    }
                  />
                </DocumentSection>

                <DocumentSection title="Custody Information">
                  <InfoItem
                    label="Checkout Date"
                    value={
                      selectedDocument.custodyRecord
                        ?.checkoutDate
                        ? formatDateTime(
                            selectedDocument.custodyRecord
                              .checkoutDate
                          )
                        : "-"
                    }
                  />

                  <InfoItem
                    label="Check-in Date"
                    value={
                      selectedDocument.custodyRecord
                        ?.checkinDate
                        ? formatDateTime(
                            selectedDocument.custodyRecord
                              .checkinDate
                          )
                        : "Not returned"
                    }
                  />

                  <InfoItem
                    label="Condition at Checkout"
                    value={
                      selectedDocument.custodyRecord
                        ?.conditionAtCheckout ||
                      selectedDocument.custodyRecord
                        ?.checkoutCondition ||
                      "-"
                    }
                  />

                  <InfoItem
                    label="Condition at Check-in"
                    value={
                      selectedDocument.custodyRecord
                        ?.conditionAtCheckin ||
                      selectedDocument.custodyRecord
                        ?.checkinCondition ||
                      "-"
                    }
                  />
                </DocumentSection>

                <DocumentSection title="Signature Information">
                  <SignatureInfo
                    title="Employee Signature"
                    signedAt={
                      selectedDocument.employeeSignedAt
                    }
                  />

                  <SignatureInfo
                    title="Admin Signature"
                    signedAt={
                      selectedDocument.adminSignedAt
                    }
                  />
                </DocumentSection>

                {selectedDocument.status === "COMPLETED" && (
                  <div className="rounded-lg border bg-muted/20 p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />

                      <div className="flex-1">
                        <p className="text-sm font-semibold">
                          Handover Successfully Completed
                        </p>

                        <p className="text-xs text-muted-foreground mt-0.5">
                          Both required signatures have been completed.
                        </p>
                      </div>

                      <Button
                        size="sm"
                        className="h-8 gap-1.5 text-xs"
                        onClick={() =>
                          handleDownloadPdf(
                            selectedDocument
                          )
                        }
                        disabled={
                          downloadingId ===
                          selectedDocument.id
                        }
                      >
                        <Download className="h-3.5 w-3.5" />

                        {downloadingId ===
                        selectedDocument.id
                          ? "Downloading..."
                          : "Download PDF"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="shrink-0 flex justify-end pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sign Confirmation Dialog */}
      <Dialog
        open={signOpen}
        onOpenChange={(open) => {
          if (!signingId) {
            setSignOpen(open)

            if (!open) {
              setSignDocument(null)
            }
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenLine className="h-5 w-5 text-primary" />
              Confirm Signature
            </DialogTitle>

            <DialogDescription>
              Please confirm that you want to digitally acknowledge this
              handover document.
            </DialogDescription>
          </DialogHeader>

          {signDocument && (
            <div className="space-y-4 py-3">
              <div className="rounded-lg border bg-muted/20 p-4">
                <div className="space-y-3">
                  <InfoItem
                    label="Document ID"
                    value={signDocument.documentId}
                  />

                  <InfoItem
                    label="Employee"
                    value={signDocument.employee?.name || "-"}
                  />

                  <InfoItem
                    label="Asset"
                    value={
                      signDocument.asset?.assetTag ||
                      signDocument.asset?.assetId ||
                      "-"
                    }
                  />

                  <InfoItem
                    label="Current Stage"
                    value={
                      signDocument.status ===
                      "PENDING_EMPLOYEE_SIGNATURE"
                        ? "Employee Signature"
                        : "Admin Signature"
                    }
                  />
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium">
                  Digital acknowledgement
                </p>

                <p className="text-xs text-muted-foreground mt-1">
                  By clicking Confirm Sign, you acknowledge and approve
                  this official asset handover record.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSignOpen(false)
                setSignDocument(null)
              }}
              disabled={!!signingId}
            >
              Cancel
            </Button>

            <Button
              size="sm"
              onClick={handleSignDocument}
              disabled={!!signingId}
            >
              <PenLine className="h-3.5 w-3.5 mr-1.5" />

              {signingId === signDocument?.id
                ? "Signing..."
                : "Confirm Sign"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Handover Dialog */}
      {isAdmin && (
        <Dialog
          open={createOpen}
          onOpenChange={handleCloseDialog}
        >
          <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader className="shrink-0">
              <DialogTitle>
                Create Handover Document
              </DialogTitle>

              <DialogDescription>
                Select the employee and asset for this official handover.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto pr-2 min-h-0">
              <div className="space-y-5 py-4">
                <div className="space-y-2">
                  <Label>Employee</Label>

                  {employeesLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : employees.length === 0 ? (
                    <div className="rounded-md border p-3">
                      <p className="text-xs text-muted-foreground">
                        No employees available.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                        <Input
                          value={employeeSearch}
                          onChange={(e) =>
                            setEmployeeSearch(e.target.value)
                          }
                          placeholder="Search employee by name, ID or department..."
                          className="h-10 pl-9 text-sm"
                        />
                      </div>

                      <div className="max-h-48 overflow-y-auto rounded-md border">
                        {filteredEmployees.length === 0 ? (
                          <div className="p-4 text-center">
                            <p className="text-xs text-muted-foreground">
                              No matching employees found.
                            </p>
                          </div>
                        ) : (
                          <div className="divide-y">
                            {filteredEmployees.map((employee) => {
                              const isSelected =
                                selectedEmployee === employee.id

                              return (
                                <button
                                  key={employee.id}
                                  type="button"
                                  onClick={() =>
                                    handleEmployeeSelect(
                                      employee.id
                                    )
                                  }
                                  className={`w-full text-left px-3 py-2.5 transition-colors ${
                                    isSelected
                                      ? "bg-primary/10"
                                      : "hover:bg-muted/40"
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium truncate">
                                        {employee.name || "-"}
                                      </p>

                                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                                        {employee.employeeId || "-"}
                                        {employee.department
                                          ? ` • ${employee.department}`
                                          : ""}
                                      </p>
                                    </div>

                                    {isSelected && (
                                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                                    )}
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {selectedEmployeeData && (
                  <div className="rounded-md border bg-muted/20 p-3">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Selected Employee
                    </p>

                    <p className="text-sm font-medium mt-1">
                      {selectedEmployeeData.name}
                    </p>

                    <p className="text-xs text-muted-foreground mt-0.5">
                      {selectedEmployeeData.employeeId}
                      {selectedEmployeeData.department
                        ? ` • ${selectedEmployeeData.department}`
                        : ""}
                    </p>
                  </div>
                )}

                {selectedEmployee && (
                  <div className="space-y-2">
                    <Label>Asset</Label>

                    {assetsLoading ? (
                      <Skeleton className="h-10 w-full" />
                    ) : employeeAssets.length === 0 ? (
                      <div className="rounded-md border p-3">
                        <p className="text-xs font-medium">
                          No assets found for this employee.
                        </p>

                        <p className="text-[11px] text-muted-foreground mt-1">
                          Only assets currently assigned to the selected
                          employee are available for handover.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="relative">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                          <Input
                            value={assetSearch}
                            onChange={(e) =>
                              setAssetSearch(e.target.value)
                            }
                            placeholder="Search asset by tag, ID, model or category..."
                            className="h-10 pl-9 text-sm"
                          />
                        </div>

                        <div className="max-h-48 overflow-y-auto rounded-md border">
                          {filteredEmployeeAssets.length === 0 ? (
                            <div className="p-4 text-center">
                              <p className="text-xs text-muted-foreground">
                                No matching assets found.
                              </p>
                            </div>
                          ) : (
                            <div className="divide-y">
                              {filteredEmployeeAssets.map((asset) => {
                                const isSelected =
                                  selectedAsset === asset.id

                                return (
                                  <button
                                    key={asset.id}
                                    type="button"
                                    onClick={() =>
                                      handleAssetSelect(
                                        asset.id
                                      )
                                    }
                                    className={`w-full text-left px-3 py-2.5 transition-colors ${
                                      isSelected
                                        ? "bg-primary/10"
                                        : "hover:bg-muted/40"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">
                                          {asset.assetTag ||
                                            asset.assetId ||
                                            "Asset"}
                                        </p>

                                        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                                          {asset.model ||
                                            asset.category ||
                                            "Unknown"}

                                          {asset.serialNumber
                                            ? ` • ${asset.serialNumber}`
                                            : asset.serial
                                              ? ` • ${asset.serial}`
                                              : ""}
                                        </p>
                                      </div>

                                      {isSelected && (
                                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                                      )}
                                    </div>
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {selectedAssetData && (
                  <div className="rounded-md border bg-muted/20 p-3">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Selected Asset
                    </p>

                    <p className="text-sm font-medium mt-1">
                      {selectedAssetData.assetTag ||
                        selectedAssetData.assetId ||
                        "-"}
                    </p>

                    <p className="text-xs text-muted-foreground mt-0.5">
                      {selectedAssetData.model ||
                        selectedAssetData.category ||
                        "-"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="shrink-0 flex justify-end gap-2 pt-3 border-t bg-background">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCloseDialog(false)}
                disabled={creating}
              >
                Cancel
              </Button>

              <Button
                size="sm"
                onClick={handleCreateHandover}
                disabled={
                  !selectedEmployee ||
                  !selectedAsset ||
                  creating
                }
              >
                {creating
                  ? "Creating..."
                  : "Create Handover"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function SummaryCard({ title, value, icon: Icon }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
        <CardTitle className="text-xs font-semibold text-muted-foreground">
          {title}
        </CardTitle>

        <div className="rounded-md p-1.5 bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        <div className="text-2xl font-bold tracking-tight">
          {value}
        </div>
      </CardContent>
    </Card>
  )
}

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      <p className="text-xs font-medium text-foreground truncate">
        {value}
      </p>
    </div>
  )
}

function DocumentSection({ title, children }) {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-3">
        {title}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg border p-4">
        {children}
      </div>
    </div>
  )
}

function SignatureInfo({ title, signedAt }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {title}
      </p>

      {signedAt ? (
        <div className="flex items-center gap-2 mt-2">
          <CheckCircle2 className="h-4 w-4 text-green-600" />

          <p className="text-xs font-medium">
            Signed
          </p>

          <p className="text-[11px] text-muted-foreground">
            {formatDateTime(signedAt)}
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-2 mt-2">
          <Clock3 className="h-4 w-4 text-muted-foreground" />

          <p className="text-xs font-medium">
            Pending
          </p>
        </div>
      )}
    </div>
  )
}