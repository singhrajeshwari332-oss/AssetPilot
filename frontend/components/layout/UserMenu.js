"use client"

import React from "react"
import { LogOut, User as UserIcon } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function UserMenu() {
  const { user, logout } = useAuth()

  const getInitials = (name) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-9 flex items-center gap-2 pl-2 pr-3 rounded-full hover:bg-accent focus-visible:ring-1"
          aria-label="User account menu"
        >
          <Avatar className="h-7 w-7 border border-border">
            <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
              {getInitials(user?.name)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline-block text-xs font-medium text-foreground max-w-[120px] truncate">
            {user?.name || "User"}
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 p-1.5" sideOffset={8}>
        <DropdownMenuLabel className="font-normal px-2 py-1.5">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-semibold text-foreground truncate">
              {user?.name || "Authenticated User"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email || "user@company.com"}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1" />
        <DropdownMenuItem
          onClick={logout}
          className="flex items-center gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer rounded-sm px-2 py-1.5 text-xs font-medium"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
