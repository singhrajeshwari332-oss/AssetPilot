"use client"

import React, { useEffect, useState } from "react"
import {
Dialog,
DialogContent,
DialogHeader,
DialogTitle,
DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import api from "@/services/api"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

const initialForm = {
employeeId: "",
name: "",
email: "",
department: "",
designation: "",
manager: "",
employmentType: "",
workLocation: "",
employmentStatus: "ACTIVE",
joinDate: "",
exitDate: "",
dob: "",
gender: "",
bloodGroup: "",
phone: "",
address: "",
profilePhoto: "",
}

export function EmployeeDialog({
open,
onOpenChange,
employee,
onSuccess,
}) {
const [form, setForm] = useState(initialForm)
const [loading, setLoading] = useState(false)

const isEditing = Boolean(employee?.id)

useEffect(() => {
if (!open) return


if (employee) {
  setForm({
    employeeId: employee.employeeId || "",
    name: employee.name || "",
    email: employee.email || "",
    department: employee.department || "",
    designation: employee.designation || "",
    manager: employee.manager || "",
    employmentType: employee.employmentType || "",
    workLocation: employee.workLocation || "",
    employmentStatus: employee.employmentStatus || "ACTIVE",
    joinDate: employee.joinDate
      ? employee.joinDate.substring(0, 10)
      : "",
    exitDate: employee.exitDate
      ? employee.exitDate.substring(0, 10)
      : "",
    dob: employee.dob
      ? employee.dob.substring(0, 10)
      : "",
    gender: employee.gender || "",
    bloodGroup: employee.bloodGroup || "",
    phone: employee.phone || "",
    address: employee.address || "",
    profilePhoto: employee.profilePhoto || "",
  })
} else {
  setForm(initialForm)
}


}, [open, employee])

const handleChange = (field, value) => {
setForm((prev) => ({
...prev,
[field]: value,
}))
}

const handleSubmit = async (e) => {
e.preventDefault()

if (!form.name.trim()) {
  toast.error("Employee name is required.")
  return
}

if (!form.email.trim()) {
  toast.error("Email is required.")
  return
}

if (!form.department.trim()) {
  toast.error("Department is required.")
  return
}

if (!form.designation.trim()) {
  toast.error("Designation is required.")
  return
}

try {
  setLoading(true)

  const payload = {
    employeeId: form.employeeId.trim() || undefined,
    name: form.name.trim(),
    email: form.email.trim(),
    department: form.department.trim(),
    designation: form.designation.trim(),
    manager: form.manager.trim() || null,
    employmentType: form.employmentType || null,
    workLocation: form.workLocation.trim() || null,
    employmentStatus: form.employmentStatus || "ACTIVE",
    joinDate: form.joinDate || null,
    exitDate: form.exitDate || null,
    dob: form.dob || null,
    gender: form.gender || null,
    bloodGroup: form.bloodGroup || null,
    phone: form.phone.trim() || null,
    address: form.address.trim() || null,
    profilePhoto: form.profilePhoto.trim() || null,
  }

  if (isEditing) {
    await api.put(`/employees/${employee.id}`, payload)
    toast.success("Employee updated successfully.")
  } else {
    await api.post("/employees", payload)
    toast.success("Employee created successfully.")
  }

  onOpenChange(false)

  if (onSuccess) {
    await onSuccess()
  }
} catch (error) {
  console.error("Employee save error:", error)

  toast.error(
    error?.response?.data?.message ||
      "Failed to save employee details."
  )
} finally {
  setLoading(false)
}

}

return ( <Dialog open={open} onOpenChange={onOpenChange}> <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto"> <DialogHeader> <DialogTitle>
{isEditing ? "Edit Employee" : "Add Employee"} </DialogTitle> </DialogHeader>

    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Basic Information */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold">
          Basic Information
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

          <Field label="Employee ID">
            <Input
              value={form.employeeId}
              onChange={(e) =>
                handleChange("employeeId", e.target.value)
              }
              placeholder="EMP-1001"
              disabled={isEditing}
            />
          </Field>

          <Field label="Full Name" required>
            <Input
              value={form.name}
              onChange={(e) =>
                handleChange("name", e.target.value)
              }
              placeholder="Employee name"
            />
          </Field>

          <Field label="Email" required>
            <Input
              type="email"
              value={form.email}
              onChange={(e) =>
                handleChange("email", e.target.value)
              }
              placeholder="employee@company.com"
            />
          </Field>

          <Field label="Phone">
            <Input
              value={form.phone}
              onChange={(e) =>
                handleChange("phone", e.target.value)
              }
              placeholder="Phone number"
            />
          </Field>

        </div>
      </section>

      {/* Personal Information */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold">
          Personal Information
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

          <Field label="Date of Birth">
            <Input
              type="date"
              value={form.dob}
              onChange={(e) =>
                handleChange("dob", e.target.value)
              }
            />
          </Field>

          <Field label="Gender">
            <Select
              value={form.gender || "NONE"}
              onValueChange={(value) =>
                handleChange(
                  "gender",
                  value === "NONE" ? "" : value
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="NONE">
                  Not specified
                </SelectItem>
                <SelectItem value="MALE">
                  Male
                </SelectItem>
                <SelectItem value="FEMALE">
                  Female
                </SelectItem>
                <SelectItem value="OTHER">
                  Other
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label="Blood Group">
            <Select
              value={form.bloodGroup || "NONE"}
              onValueChange={(value) =>
                handleChange(
                  "bloodGroup",
                  value === "NONE" ? "" : value
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select blood group" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="NONE">
                  Not specified
                </SelectItem>
                <SelectItem value="A+">A+</SelectItem>
                <SelectItem value="A-">A-</SelectItem>
                <SelectItem value="B+">B+</SelectItem>
                <SelectItem value="B-">B-</SelectItem>
                <SelectItem value="AB+">AB+</SelectItem>
                <SelectItem value="AB-">AB-</SelectItem>
                <SelectItem value="O+">O+</SelectItem>
                <SelectItem value="O-">O-</SelectItem>
              </SelectContent>
            </Select>
          </Field>

        </div>

        <Field label="Address">
          <textarea
            value={form.address}
            onChange={(e) =>
              handleChange("address", e.target.value)
            }
            placeholder="Residential address"
            rows={3}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </Field>
      </section>

      {/* Work Information */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold">
          Work Information
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

          <Field label="Department" required>
            <Input
              value={form.department}
              onChange={(e) =>
                handleChange("department", e.target.value)
              }
              placeholder="Department"
            />
          </Field>

          <Field label="Designation" required>
            <Input
              value={form.designation}
              onChange={(e) =>
                handleChange("designation", e.target.value)
              }
              placeholder="Designation"
            />
          </Field>

          <Field label="Manager">
            <Input
              value={form.manager}
              onChange={(e) =>
                handleChange("manager", e.target.value)
              }
              placeholder="Manager name"
            />
          </Field>

          <Field label="Employment Type">
            <Select
              value={form.employmentType || "NONE"}
              onValueChange={(value) =>
                handleChange(
                  "employmentType",
                  value === "NONE" ? "" : value
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="NONE">
                  Not specified
                </SelectItem>
                <SelectItem value="FULL_TIME">
                  Full Time
                </SelectItem>
                <SelectItem value="PART_TIME">
                  Part Time
                </SelectItem>
                <SelectItem value="CONTRACT">
                  Contract
                </SelectItem>
                <SelectItem value="INTERN">
                  Intern
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label="Work Location">
            <Input
              value={form.workLocation}
              onChange={(e) =>
                handleChange("workLocation", e.target.value)
              }
              placeholder="Office / Location"
            />
          </Field>

          <Field label="Employment Status">
            <Select
              value={form.employmentStatus}
              onValueChange={(value) =>
                handleChange("employmentStatus", value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="ACTIVE">
                  Active
                </SelectItem>
                <SelectItem value="INACTIVE">
                  Inactive
                </SelectItem>
                <SelectItem value="ON_LEAVE">
                  On Leave
                </SelectItem>
                <SelectItem value="TERMINATED">
                  Terminated
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label="Join Date">
            <Input
              type="date"
              value={form.joinDate}
              onChange={(e) =>
                handleChange("joinDate", e.target.value)
              }
            />
          </Field>

          <Field label="Exit Date">
            <Input
              type="date"
              value={form.exitDate}
              onChange={(e) =>
                handleChange("exitDate", e.target.value)
              }
            />
          </Field>

        </div>
      </section>

      {/* Profile Photo */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold">
          Profile Photo
        </h3>

        <Field label="Profile Photo URL">
          <Input
            value={form.profilePhoto}
            onChange={(e) =>
              handleChange("profilePhoto", e.target.value)
            }
            placeholder="https://example.com/photo.jpg"
          />
        </Field>

        {form.profilePhoto && (
          <div className="flex items-center gap-3">
            <img
              src={form.profilePhoto}
              alt="Profile preview"
              className="h-16 w-16 rounded-lg border object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none"
              }}
            />

            <span className="text-xs text-muted-foreground">
              Profile photo preview
            </span>
          </div>
        )}
      </section>

      <DialogFooter className="border-t pt-5">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={loading}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          disabled={loading}
        >
          {loading && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}

          {isEditing
            ? "Save Changes"
            : "Create Employee"}
        </Button>
      </DialogFooter>

    </form>
  </DialogContent>
</Dialog>
)
}

function Field({ label, required, children }) {
return ( <div className="space-y-2"> <Label>
{label}
{required && ( <span className="ml-1 text-destructive">*</span>
)} </Label>
  {children}
</div>
)
}