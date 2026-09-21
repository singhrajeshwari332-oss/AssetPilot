"use client"

import React from "react"
import { Sun, Moon, Laptop, Check } from "lucide-react"
import { useTheme } from "@/context/ThemeContext"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme()

  return (
    <TooltipProvider>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" aria-label="Toggle theme">
                {resolvedTheme === "dark" ? (
                  <Moon className="h-[1.1rem] w-[1.1rem] transition-transform" />
                ) : (
                  <Sun className="h-[1.1rem] w-[1.1rem] transition-transform" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <span>Theme settings</span>
          </TooltipContent>
        </Tooltip>

        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem
            onClick={() => setTheme("light")}
            className="flex items-center justify-between cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-amber-500" />
              <span>Light</span>
            </span>
            {theme === "light" && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setTheme("dark")}
            className="flex items-center justify-between cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Moon className="h-4 w-4 text-indigo-400" />
              <span>Dark</span>
            </span>
            {theme === "dark" && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setTheme("system")}
            className="flex items-center justify-between cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Laptop className="h-4 w-4 text-muted-foreground" />
              <span>System</span>
            </span>
            {theme === "system" && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  )
}
