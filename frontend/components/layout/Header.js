"use client"

import React from "react"
import { Menu, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "./ThemeToggle"
import { NotificationMenu } from "./NotificationMenu"
import { UserMenu } from "./UserMenu"

export function Header({ onMobileMenuToggle }) {
  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 md:hidden text-muted-foreground hover:text-foreground"
          onClick={onMobileMenuToggle}
          aria-label="Open mobile navigation"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2 md:hidden">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs shadow-sm">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <span className="font-semibold text-sm tracking-tight">AssetPilot</span>
        </div>
      </div>

      {/* Top-Right Controls strictly in order: [ Theme ] [ Notification ] [ Login/User ] */}
      <div className="flex items-center space-x-2 sm:space-x-3 ml-auto">
        <ThemeToggle />
        <NotificationMenu />
        <UserMenu />
      </div>
    </header>
  )
}
