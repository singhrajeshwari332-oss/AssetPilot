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
  TrendingUp,
  Activity,
  ArrowRight,
  Plus,
  RefreshCw,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusBadge } from "@/components/common/StatusBadge"
import { formatDateTime } from "@/lib/utils"
import api from "@/services/api"

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [categoryBreakdown, setCategoryBreakdown] = useState({})
  const [recentActivities, setRecentActivities] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const res = await api.get("/dashboard/stats")
      setStats(res.data?.stats || {})
      setCategoryBreakdown(res.data?.categoryBreakdown || {})
      setRecentActivities(res.data?.recentActivities || [])
    } catch (err) {
      console.error("Failed to load dashboard metrics:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const statCards = [
    {
      title: "Total Assets",
      value: stats?.totalAssets,
      icon: Laptop,
      href: "/assets",
      description: "Hardware & Software entities",
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
      description: "Terminal decommissioned",
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
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Asset Operations Dashboard
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time telemetry, custody allocation status, and deterministic lifecycle tracking.
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
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
          <Button size="sm" asChild className="h-8 gap-1.5 text-xs">
            <Link href="/assets">
              <Plus className="h-3.5 w-3.5" />
              <span>Manage Assets</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Link key={card.title} href={card.href} className="block">
              <Card className="hover:border-primary/40 hover:shadow-md transition-all cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
                  <CardTitle className="text-xs font-semibold text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  <div className={`rounded-md p-1.5 ${card.bg} ${card.color}`}>
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
                  <p className="text-[11px] text-muted-foreground mt-1 truncate">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Grid for Breakdown & Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Category Breakdown Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span>Asset Category Breakdown</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Distribution of inventory by hardware type
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-7 w-full" />
                <Skeleton className="h-7 w-full" />
                <Skeleton className="h-7 w-full" />
              </div>
            ) : Object.keys(categoryLabels).length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No category data</p>
            ) : (
              Object.entries(categoryLabels).map(([catKey, catName]) => {
                const count = categoryBreakdown[catKey] || 0
                const total = stats?.totalAssets || 1
                const percentage = Math.round((count / total) * 100) || 0

                return (
                  <div key={catKey} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">{catName}</span>
                      <span className="text-muted-foreground">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Recent Activity Card */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <span>Recent System Activity</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Real immutable audit trail entries
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="h-8 text-xs gap-1">
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
                {recentActivities.map((act) => (
                  <div
                    key={act.id}
                    className="flex items-start justify-between gap-4 rounded-lg border p-3 bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-foreground font-mono">
                          {act.action}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          by {act.user?.name || "System"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {act.details || "No details provided"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-[10px] text-muted-foreground">
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
