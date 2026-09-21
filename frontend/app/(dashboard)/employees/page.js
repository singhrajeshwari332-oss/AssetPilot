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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TableSkeleton } from "@/components/common/TableSkeleton"
import { EmptyState } from "@/components/common/EmptyState"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { EmployeeDialog } from "@/components/employees/EmployeeDialog"
import { EmployeeDetailsDialog } from "@/components/employees/EmployeeDetailsDialog"
import { formatDate } from "@/lib/utils"
import {
  Users,
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Laptop,
  KeyRound,
  RefreshCw,
} from "lucide-react"
import api from "@/services/api"
import { toast } from "sonner"

const DEPARTMENTS = [
  { value: "ALL", label: "All Departments" },
  { value: "Engineering", label: "Engineering" },
  { value: "Product Design", label: "Product Design" },
  { value: "Product Management", label: "Product Management" },
  { value: "DevOps & Infra", label: "DevOps & Infra" },
  { value: "Human Resources", label: "Human Resources" },
  { value: "Marketing & Sales", label: "Marketing & Sales" },
]

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [department, setDepartment] = useState("ALL")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 10 })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [detailsEmployee, setDetailsEmployee] = useState(null)

  const [deleteModal, setDeleteModal] = useState({
    open: false,
    employee: null,
    loading: false,
  })

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true)
      const params = {
        page,
        limit: 10,
        search: search.trim(),
        department,
      }
      const res = await api.get("/employees", { params })
      setEmployees(res.data?.data || [])
      setPagination(res.data?.pagination || { total: 0, totalPages: 1, limit: 10 })
    } catch (err) {
      console.error("Failed to fetch employees:", err)
      toast.error("Failed to load employee directory.")
    } finally {
      setLoading(false)
    }
  }, [page, search, department])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  const handleDeleteEmployee = async () => {
    if (!deleteModal.employee) return
    setDeleteModal((prev) => ({ ...prev, loading: true }))

    try {
      await api.delete(`/employees/${deleteModal.employee.id}`)
      toast.success(`✓ Employee ${deleteModal.employee.name} deleted successfully.`)
      setDeleteModal({ open: false, employee: null, loading: false })
      fetchEmployees()
    } catch (err) {
      const msg = err.response?.data?.message || "✕ Failed to delete employee."
      toast.error(msg)
      setDeleteModal((prev) => ({ ...prev, loading: false }))
    }
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Personnel & Custody Directory
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage company employees, their active hardware assignments, and software licenses.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchEmployees}
            disabled={loading}
            className="h-8 gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditingEmployee(null)
              setDialogOpen(true)
            }}
            className="h-8 gap-1.5 text-xs font-medium"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Employee</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-card p-3 rounded-lg border">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by name, ID, email, role..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="h-8 pl-8 text-xs bg-background"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="w-44">
            <Select
              value={department}
              onValueChange={(val) => {
                setDepartment(val)
                setPage(1)
              }}
            >
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((dept) => (
                  <SelectItem key={dept.value} value={dept.value} className="text-xs">
                    {dept.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(search || department !== "ALL") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("")
                setDepartment("ALL")
                setPage(1)
              }}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Employees Table */}
      <div className="rounded-lg border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[110px]">Employee ID</TableHead>
              <TableHead>Employee Details</TableHead>
              <TableHead>Department</TableHead>
              <TableHead className="hidden md:table-cell">Designation</TableHead>
              <TableHead>Assigned Assets</TableHead>
              <TableHead className="hidden lg:table-cell">Active Licenses</TableHead>
              <TableHead className="hidden xl:table-cell">Joined Date</TableHead>
              <TableHead className="text-right w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableSkeleton rows={6} columns={8} />
            ) : employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-64 p-0">
                  <EmptyState
                    icon={Users}
                    title="No employees found"
                    description="No personnel records matched your filter criteria."
                    actionLabel="Add New Employee"
                    onAction={() => {
                      setEditingEmployee(null)
                      setDialogOpen(true)
                    }}
                  />
                </TableCell>
              </TableRow>
            ) : (
              employees.map((emp) => (
                <TableRow key={emp.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-mono text-xs font-bold text-foreground">
                    <span className="px-1.5 py-0.5 rounded bg-muted border">
                      {emp.employeeId}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div 
                      className="flex flex-col cursor-pointer group"
                      onClick={() => setDetailsEmployee(emp)}
                    >
                      <span className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors hover:underline">
                        {emp.name}
                      </span>
                      <span className="text-[11px] text-muted-foreground group-hover:text-primary/70 transition-colors">
                        {emp.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-medium">
                    {emp.department}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                    {emp.designation}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-md bg-sky-500/10 px-2 py-0.5 text-xs font-semibold text-sky-700 dark:text-sky-400">
                        <Laptop className="h-3 w-3" />
                        {emp.activeAssetsCount || 0} Assets
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 px-2 py-0.5 text-xs font-semibold text-purple-700 dark:text-purple-400">
                      <KeyRound className="h-3 w-3" />
                      {emp.activeLicensesCount || 0} Seats
                    </span>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">
                    {formatDate(emp.joinDate)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          aria-label="Employee actions"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 text-xs">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingEmployee(emp)
                            setDialogOpen(true)
                          }}
                          className="gap-2 cursor-pointer"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          <span>Edit Details</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteModal({ open: true, employee: emp, loading: false })}
                          disabled={emp.activeAssetsCount > 0 || emp.activeLicensesCount > 0}
                          className="gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete Employee</span>
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
              {employees.length === 0 ? 0 : (page - 1) * pagination.limit + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium text-foreground">
              {Math.min(page * pagination.limit, pagination.total)}
            </span>{" "}
            of <span className="font-medium text-foreground">{pagination.total}</span> employees
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

      {/* Create / Edit Employee Modal */}
      <EmployeeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        employee={editingEmployee}
        onSuccess={fetchEmployees}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={deleteModal.open}
        onOpenChange={(open) => setDeleteModal((prev) => ({ ...prev, open }))}
        title="Delete Employee Record?"
        description={`Are you sure you want to permanently remove employee [${deleteModal.employee?.employeeId}] ${deleteModal.employee?.name}? This action cannot be undone.`}
        confirmLabel="Delete Employee"
        variant="destructive"
        loading={deleteModal.loading}
        onConfirm={handleDeleteEmployee}
      />

      {/* Employee Full Details Modal */}
      <EmployeeDetailsDialog
        open={!!detailsEmployee}
        onOpenChange={(open) => {
          if (!open) setDetailsEmployee(null)
        }}
        employee={detailsEmployee}
      />
    </div>
  )
}
