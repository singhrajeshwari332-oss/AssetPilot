"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import {
  Laptop,
  CheckCircle2,
  UserCheck,
  RotateCcw,
  Wrench,
  Archive,
  KeyRound,
  Users,
  ArrowRight,
  RefreshCw,
  FileText,
  ChevronRight,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDateTime } from "@/lib/utils"
import api from "@/services/api"
import { useAuth } from "@/context/AuthContext"

export default function DashboardPage() {
  const { user } = useAuth()

  const [stats, setStats] = useState(null)
  const [categoryBreakdown, setCategoryBreakdown] = useState({})
  const [recentActivities, setRecentActivities] = useState([])
  const [employeeData, setEmployeeData] = useState(null)
  const [loading, setLoading] = useState(true)

  const isEmployee = user?.role === "EMPLOYEE"

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      const res = await api.get("/dashboard/stats")

      setStats(res.data?.stats || {})
      setCategoryBreakdown(res.data?.categoryBreakdown || {})
      setRecentActivities(res.data?.recentActivities || [])

      if (res.data?.employeeDashboard) {
        setEmployeeData(res.data)
      } else {
        setEmployeeData(null)
      }
    } catch (err) {
      console.error("Failed to load dashboard metrics:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  // ============================================================
  // DISPLAY HELPERS
  // ============================================================

  const formatStatus = (status) => {
    if (!status) return "-"

    return status
      .toLowerCase()
      .split("_")
      .map(
        (word) => word.charAt(0).toUpperCase() + word.slice(1)
      )
      .join(" ")
  }

  // ============================================================
  // EMPLOYEE DASHBOARD
  // ============================================================

  if (isEmployee) {
    const employeeStats = [
      {
        title: "My Assets",
        value: employeeData?.stats?.assignedAssets,
        icon: Laptop,
        href: "/assets",
        description: "Assets currently assigned to you",
        color: "text-blue-500",
        bg: "bg-blue-500/10",
      },
      {
        title: "My Licenses",
        value: employeeData?.stats?.activeLicenseAllocations,
        icon: KeyRound,
        href: "/licenses",
        description: "Active license allocations",
        color: "text-purple-500",
        bg: "bg-purple-500/10",
      },
      {
        title: "Return Requests",
        value: employeeData?.stats?.pendingReturns,
        icon: RotateCcw,
        href: "/returns",
        description: "Your pending return requests",
        color: "text-amber-500",
        bg: "bg-amber-500/10",
      },
      {
        title: "Repair Requests",
        value: employeeData?.stats?.repairRequests,
        icon: Wrench,
        href: "/repairs",
        description: "Your asset repair records",
        color: "text-red-500",
        bg: "bg-red-500/10",
      },
      {
        title: "Documents",
        value: employeeData?.stats?.documents,
        icon: FileText,
        href: "/documents",
        description: "Your handover documents",
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
      },
    ]

    return (
      <div className="space-y-6">
        {/* Employee Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              My Dashboard
            </h1>

            <p className="text-xs text-muted-foreground mt-0.5">
              Track asset status, assignments, and lifecycle in real time.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            disabled={loading}
            className="h-8 gap-1.5 text-xs w-fit"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${
                loading ? "animate-spin" : ""
              }`}
            />
            <span>Refresh</span>
          </Button>
        </div>

        {/* Employee KPI Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-5 sm:gap-4">
          {employeeStats.map((card) => {
            const Icon = card.icon

            return (
              <Link
                key={card.title}
                href={card.href}
                className="block"
              >
                <Card className="hover:border-primary/40 hover:shadow-md transition-all cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
                    <CardTitle className="text-xs font-semibold text-muted-foreground">
                      {card.title}
                    </CardTitle>

                    <div
                      className={`rounded-md p-1.5 ${card.bg} ${card.color}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 pt-0">
                    {loading ? (
                      <Skeleton className="h-7 w-16 mb-1" />
                    ) : (
                      <div className="text-2xl font-bold tracking-tight text-foreground">
                        {card.value ?? 0}
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {card.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* My Assets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Laptop className="h-4 w-4 text-primary" />
                <span>My Assigned Assets</span>
              </CardTitle>

              <CardDescription className="text-xs">
                Assets currently in your custody
              </CardDescription>
            </div>

            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-8 text-xs gap-1"
            >
              <Link href="/assets">
                <span>View Assets</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : !employeeData?.assignedAssets?.length ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No assets are currently assigned to you.
              </div>
            ) : (
              <div className="space-y-3">
                {employeeData.assignedAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center justify-between gap-4 rounded-lg border p-3 bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="rounded-md p-2 bg-blue-500/10 text-blue-500">
                        <Laptop className="h-4 w-4" />
                      </div>

                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-foreground">
                          {asset.assetTag}
                        </p>

                        <p className="text-xs text-muted-foreground truncate">
                          {asset.brand} {asset.model}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">
                        Assigned
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(asset.assignedDate)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documents + Licenses */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Documents */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span>My Documents</span>
                </CardTitle>

                <CardDescription className="text-xs">
                  Your digital handover documents
                </CardDescription>
              </div>

              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-8 text-xs gap-1"
              >
                <Link href="/documents">
                  <span>View All</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>

            <CardContent>
              {!employeeData?.documents?.length ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No documents found.
                </div>
              ) : (
                <div className="space-y-3">
                  {employeeData.documents.slice(0, 4).map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="h-4 w-4 text-emerald-500" />

                        <div className="min-w-0">
                          <p className="text-xs font-semibold">
                            {doc.documentId}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {doc.documentType || "Handover Document"}
                          </p>
                        </div>
                      </div>

                      <span className="text-xs text-muted-foreground">
                        {formatStatus(doc.status)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Licenses */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-primary" />
                  <span>My Licenses</span>
                </CardTitle>

                <CardDescription className="text-xs">
                  Your active software license allocations
                </CardDescription>
              </div>

              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-8 text-xs gap-1"
              >
                <Link href="/licenses">
                  <span>View All</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>

            <CardContent>
              {!employeeData?.licenses?.length ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No active licenses found.
                </div>
              ) : (
                <div className="space-y-3">
                  {employeeData.licenses.slice(0, 4).map((license) => (
                    <div
                      key={license.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <KeyRound className="h-4 w-4 text-purple-500" />

                        <div className="min-w-0">
                          <p className="text-xs font-semibold">
                            {license.asset?.brand} {license.asset?.model}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {license.asset?.assetTag || "Software License"}
                          </p>
                        </div>
                      </div>

                      <span className="text-xs text-emerald-500">
                        Active
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Returns + Repairs */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Returns */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-primary" />
                  <span>My Return Requests</span>
                </CardTitle>

                <CardDescription className="text-xs">
                  Pending asset return requests
                </CardDescription>
              </div>

              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-8 text-xs gap-1"
              >
                <Link href="/returns">
                  <span>View All</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>

            <CardContent>
              {!employeeData?.returns?.length ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No pending return requests.
                </div>
              ) : (
                <div className="space-y-3">
                  {employeeData.returns.slice(0, 4).map((request) => (
                    <div
                      key={request.id}
                      className="rounded-lg border p-3"
                    >
                      <p className="text-xs font-semibold">
                        {request.asset?.assetTag}
                      </p>

                      <p className="text-xs text-muted-foreground mt-1">
                        {request.reason || "Return requested"}
                      </p>

                      <p className="text-xs text-amber-500 mt-1">
                        {formatStatus(request.status)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Repairs */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-primary" />
                  <span>My Repairs</span>
                </CardTitle>

                <CardDescription className="text-xs">
                  Repair records related to your assets
                </CardDescription>
              </div>

              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-8 text-xs gap-1"
              >
                <Link href="/repairs">
                  <span>View All</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>

            <CardContent>
              {!employeeData?.repairs?.length ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No repair records found.
                </div>
              ) : (
                <div className="space-y-3">
                  {employeeData.repairs.slice(0, 4).map((repair) => (
                    <div
                      key={repair.id}
                      className="rounded-lg border p-3"
                    >
                      <p className="text-xs font-semibold">
                        {repair.asset?.assetTag}
                      </p>

                      <p className="text-xs text-muted-foreground mt-1">
                        {repair.issue || "Repair record"}
                      </p>

                      <p className="text-xs text-red-500 mt-1">
                        {formatStatus(repair.status)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ============================================================
  // ADMIN DASHBOARD
  // ============================================================

  const statCards = [
    {
      title: "Total Assets",
      value: stats?.totalAssets,
      icon: Laptop,
      href: "/assets",
      description: "Hardware and software assets.",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Available",
      value: stats?.availableAssets,
      icon: CheckCircle2,
      href: "/assets?status=AVAILABLE",
      description: "Ready for deployment",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Assigned",
      value: stats?.assignedAssets,
      icon: UserCheck,
      href: "/assets?status=ASSIGNED",
      description: "In employee custody",
      color: "text-sky-500",
      bg: "bg-sky-500/10",
    },
    {
      title: "Return Requested",
      value: stats?.returnRequestedAssets,
      icon: RotateCcw,
      href: "/returns",
      description: "Pending IT check-in",
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      title: "In Repair",
      value: stats?.inRepairAssets,
      icon: Wrench,
      href: "/repairs",
      description: "Under maintenance",
      color: "text-red-500",
      bg: "bg-red-500/10",
    },
    {
      title: "Retired",
      value: stats?.retiredAssets,
      icon: Archive,
      href: "/assets?status=RETIRED",
      description: "Assets decommissioned and removed from service.",
      color: "text-zinc-400",
      bg: "bg-zinc-500/10",
    },
    {
      title: "Software Licenses",
      value: stats?.softwareLicenses,
      icon: KeyRound,
      href: "/licenses",
      description: "Enterprise subscriptions",
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      title: "Active Allocations",
      value: stats?.activeLicenseAllocations,
      icon: Users,
      href: "/licenses",
      description: "Assigned license seats",
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
    },
  ]

  const categoryLabels = {
    LAPTOP: "Laptops",
    MONITOR: "Monitors",
    MOBILE_DEVICE: "Mobile Devices",
    PERIPHERAL: "Peripherals",
    SOFTWARE_LICENSE: "Software Licenses",
  }

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Asset Operations Dashboard
          </h1>

          <p className="text-xs text-muted-foreground mt-0.5">
            Track asset status, assignments, and lifecycle in real time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            disabled={loading}
            className="h-8 gap-1.5 text-xs"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${
                loading ? "animate-spin" : ""
              }`}
            />
            <span>Refresh</span>
          </Button>

          <Button
            size="sm"
            asChild
            className="h-8 gap-1.5 text-xs"
          >
            <Link href="/assets">
              <span>Manage Assets</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        {statCards.map((card) => {
          const Icon = card.icon

          return (
            <Link
              key={card.title}
              href={card.href}
              className="block"
            >
              <Card className="hover:border-primary/40 hover:shadow-md transition-all cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
                  <CardTitle className="text-xs font-semibold text-muted-foreground">
                    {card.title}
                  </CardTitle>

                  <div
                    className={`flex items-center gap-1.5 rounded-md p-1.5 ${card.bg} ${card.color}`}
                  >
                    <Icon className="h-4 w-4" />
                    <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                  </div>
                </CardHeader>

                <CardContent className="p-4 pt-0">
                  {loading ? (
                    <Skeleton className="h-7 w-16 mb-1" />
                  ) : (
                    <div className="text-2xl font-bold tracking-tight text-foreground">
                      {card.value ?? 0}
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Category Breakdown + Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Asset Category Breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <span>Asset Category Breakdown</span>
            </CardTitle>

            <CardDescription className="text-xs">
              Distribution of inventory by hardware type
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-7 w-full" />
                <Skeleton className="h-7 w-full" />
                <Skeleton className="h-7 w-full" />
              </div>
            ) : (
              Object.entries(categoryLabels).map(
                ([catKey, catName]) => {
                  const count = categoryBreakdown[catKey] || 0
                  const total = stats?.totalAssets || 1
                  const percentage =
                    Math.round((count / total) * 100) || 0

                  return (
                    <div
                      key={catKey}
                      className="space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground">
                          {catName}
                        </span>

                        <span className="text-muted-foreground">
                          {count} ({percentage}%)
                        </span>
                      </div>

                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  )
                }
              )
            )}
          </CardContent>
        </Card>

        {/* Recent System Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <span>Recent System Activity</span>
              </CardTitle>

              <CardDescription className="text-xs">
                Verified entries from the system audit log.
              </CardDescription>
            </div>

            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-8 text-xs gap-1"
            >
              <Link href="/audit-logs">
                <span>View Full Log</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : recentActivities.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No recent activity records found.
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivities.slice(0, 5).map((act) => (
                  <div
                    key={act.id}
                    className="flex items-start justify-between gap-4 rounded-lg border p-3 bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-xs text-foreground font-mono">
                          {formatStatus(act.action)}
                        </span>

                        <span className="text-xs text-muted-foreground">
                          by {act.user?.name || "System"}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {act.details || "No details provided"}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(act.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}