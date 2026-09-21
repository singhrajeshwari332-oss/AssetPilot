"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Laptop,
  Users,
  KeyRound,
  RotateCcw,
  Wrench,
  History,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const NAV_ITEMS = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Assets", href: "/assets", icon: Laptop },
  { name: "Employees", href: "/employees", icon: Users },
  { name: "Licenses", href: "/licenses", icon: KeyRound },
  { name: "Returns", href: "/returns", icon: RotateCcw },
  { name: "Repairs", href: "/repairs", icon: Wrench },
  { name: "Audit Logs", href: "/audit-logs", icon: History },
]

export function Sidebar({ mobileOpen, setMobileOpen }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const NavContent = ({ isMobile = false }) => (
    <div className="flex h-full flex-col justify-between py-4">
      <div className="space-y-6">
        {/* Brand Logo */}
        <div className="flex items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-sm transition-transform group-hover:scale-105">
              <ShieldCheck className="h-5 w-5" />
            </div>
            {(!collapsed || isMobile) && (
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight text-foreground">
                  AssetHQ
                </span>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  Enterprise
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1 px-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href)

            const linkContent = (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => isMobile && setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition-colors select-none",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  collapsed && !isMobile && "justify-center px-2"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                {(!collapsed || isMobile) && <span>{item.name}</span>}
              </Link>
            )

            if (collapsed && !isMobile) {
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.name}</p>
                  </TooltipContent>
                </Tooltip>
              )
            }

            return linkContent
          })}
        </nav>
      </div>

      {/* Collapse Toggle for Desktop */}
      {!isMobile && (
        <div className="px-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="w-full justify-center text-xs text-muted-foreground hover:text-foreground"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <div className="flex items-center gap-2">
                <ChevronLeft className="h-4 w-4" />
                <span>Collapse menu</span>
              </div>
            )}
          </Button>
        </div>
      )}
    </div>
  )

  return (
    <TooltipProvider>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r bg-card transition-all duration-200 shrink-0",
          collapsed ? "w-16" : "w-60"
        )}
      >
        <NavContent isMobile={false} />
      </aside>

      {/* Mobile Sidebar as Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-card">
          <NavContent isMobile={true} />
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  )
}
