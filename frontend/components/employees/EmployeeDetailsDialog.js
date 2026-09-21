"use client"

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatDate } from "@/lib/utils"
import { Building, Phone, Mail, User as UserIcon, Calendar, Activity, Laptop, KeyRound } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function EmployeeDetailsDialog({ open, onOpenChange, employee }) {
  if (!employee) return null

  // Calculate age
  const calculateAge = (dobString) => {
    if (!dobString) return "N/A"
    const dob = new Date(dobString)
    const diff_ms = Date.now() - dob.getTime()
    const age_dt = new Date(diff_ms)
    return Math.abs(age_dt.getUTCFullYear() - 1970)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-card">
        {/* Header section with gradient background */}
        <div className="bg-primary/5 p-6 border-b">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                  {employee.name}
                  <Badge variant="outline" className="text-[10px] font-mono bg-background">
                    {employee.employeeId}
                  </Badge>
                </DialogTitle>
                <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                  <span className="font-medium">{employee.designation}</span>
                  <span>&bull;</span>
                  <span>{employee.department}</span>
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Content sections */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[70vh] overflow-y-auto">
          
          {/* Left Column: Personal & Contact */}
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <UserIcon className="h-4 w-4" /> Personal Information
              </h4>
              <div className="bg-muted/30 p-4 rounded-lg border space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground">Date of Birth</p>
                    <p className="text-sm font-medium">{employee.dob ? formatDate(employee.dob) : "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground">Age</p>
                    <p className="text-sm font-medium">{employee.dob ? `${calculateAge(employee.dob)} years` : "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground">Gender</p>
                    <p className="text-sm font-medium">{employee.gender || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground">Blood Group</p>
                    <p className="text-sm font-medium">{employee.bloodGroup || "Not specified"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <Phone className="h-4 w-4" /> Contact Details
              </h4>
              <div className="bg-muted/30 p-4 rounded-lg border space-y-3">
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Email Address</p>
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    {employee.email}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Phone Number</p>
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    {employee.phone || "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Residential Address</p>
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5 text-muted-foreground" />
                    {employee.address || "Not specified"}
                  </p>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Employment
              </h4>
              <div className="bg-muted/30 p-4 rounded-lg border space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground">Joined On</p>
                    <p className="text-sm font-medium">{formatDate(employee.joinDate)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground">Status</p>
                    <Badge variant={employee.exitDate ? "destructive" : "default"} className="text-[10px]">
                      {employee.exitDate ? "Exited" : "Active"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Assigned Assets & Licenses */}
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <Laptop className="h-4 w-4" /> Assigned Hardware ({employee.currentAssets?.length || 0})
              </h4>
              {employee.currentAssets?.length > 0 ? (
                <div className="space-y-2">
                  {employee.currentAssets.map(asset => (
                    <div key={asset.id} className="bg-muted/30 p-3 rounded-lg border flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{asset.brand} {asset.model}</p>
                        <p className="text-[11px] text-muted-foreground font-mono">{asset.assetTag}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {asset.category}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-muted/20 p-4 rounded-lg border border-dashed text-center">
                  <p className="text-xs text-muted-foreground">No hardware assigned.</p>
                </div>
              )}
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <KeyRound className="h-4 w-4" /> Software Licenses ({employee.currentLicenses?.length || 0})
              </h4>
              {employee.currentLicenses?.length > 0 ? (
                <div className="space-y-2">
                  {employee.currentLicenses.map(license => (
                    <div key={license.id} className="bg-muted/30 p-3 rounded-lg border flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{license.brand} {license.model}</p>
                        <p className="text-[11px] text-muted-foreground font-mono">{license.assetTag}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-muted/20 p-4 rounded-lg border border-dashed text-center">
                  <p className="text-xs text-muted-foreground">No licenses assigned.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
