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

const DEPARTMENTS = [
  "Engineering",
  "Product Design",
  "Product Management",
  "DevOps & Infra",
  "Human Resources",
  "Marketing & Sales",
  "Finance & Operations",
]

export function EmployeeDialog({ open, onOpenChange, employee, onSuccess }) {
  const isEditing = Boolean(employee?.id)

  const [formData, setFormData] = useState({
    employeeId: "",
    name: "",
    email: "",
    department: "Engineering",
    designation: "",
    joinDate: "",
    dob: "",
    gender: "",
    bloodGroup: "",
    phone: "",
    address: "",
  })

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState("")

  useEffect(() => {
    if (employee) {
      setFormData({
        employeeId: employee.employeeId || "",
        name: employee.name || "",
        email: employee.email || "",
        department: employee.department || "Engineering",
        designation: employee.designation || "",
        joinDate: employee.joinDate ? employee.joinDate.split("T")[0] : "",
        dob: employee.dob ? employee.dob.split("T")[0] : "",
        gender: employee.gender || "",
        bloodGroup: employee.bloodGroup || "",
        phone: employee.phone || "",
        address: employee.address || "",
      })
    } else {
      setFormData({
        employeeId: "",
        name: "",
        email: "",
        department: "Engineering",
        designation: "",
        joinDate: new Date().toISOString().split("T")[0],
        dob: "",
        gender: "",
        bloodGroup: "",
        phone: "",
        address: "",
      })
    }
    setErrors({})
    setApiError("")
  }, [employee, open])

  const validate = () => {
    const newErrors = {}

    if (!formData.employeeId.trim()) {
      newErrors.employeeId = "Employee ID is required."
    }
    if (!formData.name.trim()) {
      newErrors.name = "Employee name is required."
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email address is required."
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = "Please enter a valid email address."
      }
    }
    if (!formData.designation.trim()) {
      newErrors.designation = "Designation is required."
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
        await api.put(`/employees/${employee.id}`, formData)
        toast.success("✓ Employee updated successfully.")
      } else {
        await api.post("/employees", formData)
        toast.success("✓ Employee created successfully.")
      }

      onSuccess?.()
      onOpenChange(false)
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to save employee."
      setApiError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">
            {isEditing ? `Edit Employee: ${employee?.name}` : "Register New Employee"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {isEditing
              ? "Update personnel information and department assignment."
              : "Onboard a new employee to enable hardware and license allocations."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto space-y-4 py-2 pr-1">
            {apiError && (
              <Alert variant="destructive" className="py-2.5 px-3 text-xs">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="ml-2 font-medium">{apiError}</AlertDescription>
              </Alert>
            )}

          <div className="space-y-1.5">
            <Label htmlFor="employeeId" className="text-xs font-medium">
              Employee ID <span className="text-destructive">*</span>
            </Label>
            <Input
              id="employeeId"
              placeholder="e.g. EMP-1010"
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value.toUpperCase() })}
              disabled={isEditing || loading}
              className={`font-mono text-xs ${errors.employeeId ? "border-destructive" : ""}`}
            />
            {errors.employeeId && <p className="text-[11px] text-destructive">{errors.employeeId}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-medium">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g. Aditi Sharma"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={loading}
              className={`text-xs ${errors.name ? "border-destructive" : ""}`}
            />
            {errors.name && <p className="text-[11px] text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-medium">
              Corporate Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="name@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={loading}
              className={`text-xs ${errors.email ? "border-destructive" : ""}`}
            />
            {errors.email && <p className="text-[11px] text-destructive">{errors.email}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="department" className="text-xs font-medium">
              Department <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.department}
              onValueChange={(val) => setFormData({ ...formData, department: val })}
              disabled={loading}
            >
              <SelectTrigger id="department" className="text-xs">
                <SelectValue placeholder="Select Department" />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((dept) => (
                  <SelectItem key={dept} value={dept} className="text-xs">
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="designation" className="text-xs font-medium">
              Designation / Role <span className="text-destructive">*</span>
            </Label>
            <Input
              id="designation"
              placeholder="e.g. Senior Software Engineer"
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              disabled={loading}
              className={`text-xs ${errors.designation ? "border-destructive" : ""}`}
            />
            {errors.designation && <p className="text-[11px] text-destructive">{errors.designation}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="joinDate" className="text-xs font-medium">
              Date of Joining
            </Label>
            <Input
              id="joinDate"
              type="date"
              value={formData.joinDate}
              onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
              disabled={loading}
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="dob" className="text-xs font-medium">
                Date of Birth
              </Label>
              <Input
                id="dob"
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                disabled={loading}
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gender" className="text-xs font-medium">
                Gender
              </Label>
              <Select
                value={formData.gender}
                onValueChange={(val) => setFormData({ ...formData, gender: val })}
                disabled={loading}
              >
                <SelectTrigger id="gender" className="text-xs">
                  <SelectValue placeholder="Select Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male" className="text-xs">Male</SelectItem>
                  <SelectItem value="Female" className="text-xs">Female</SelectItem>
                  <SelectItem value="Other" className="text-xs">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="bloodGroup" className="text-xs font-medium">
                Blood Group
              </Label>
              <Input
                id="bloodGroup"
                placeholder="e.g. O+"
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                disabled={loading}
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-medium">
                Phone Number
              </Label>
              <Input
                id="phone"
                placeholder="e.g. +1 234 567 8900"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={loading}
                className="text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address" className="text-xs font-medium">
              Address
            </Label>
            <Input
              id="address"
              placeholder="Full Residential Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              disabled={loading}
              className="text-xs"
            />
          </div>

          </div>

          <DialogFooter className="pt-3 border-t mt-4">
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
                "Update Employee"
              ) : (
                "Create Employee"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
