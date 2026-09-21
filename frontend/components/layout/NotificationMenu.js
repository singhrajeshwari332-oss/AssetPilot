"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Bell, RotateCcw, Wrench, AlertTriangle, Clock, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import api from "@/services/api"
import { formatDateTime } from "@/lib/utils"

export function NotificationMenu() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const res = await api.get("/notifications")
      setNotifications(res.data?.notifications || [])
      setUnreadCount(res.data?.unreadCount || 0)
    } catch (err) {
      console.error("Failed to load notifications:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    // Poll every 60 seconds
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  const getNotificationIcon = (type) => {
    switch (type) {
      case "RETURN_PENDING":
        return <RotateCcw className="h-4 w-4 text-amber-500" />
      case "IN_REPAIR":
        return <Wrench className="h-4 w-4 text-red-500" />
      case "LICENSE_EXPIRED":
      case "LICENSE_EXPIRING":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />
      default:
        return <Clock className="h-4 w-4 text-sky-500" />
    }
  }

  return (
    <TooltipProvider>
      <Popover open={open} onOpenChange={setOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
                aria-label="View notifications"
              >
                <Bell className="h-[1.1rem] w-[1.1rem]" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
                <span className="sr-only">Notifications</span>
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <span>Notifications ({unreadCount})</span>
          </TooltipContent>
        </Tooltip>

        <PopoverContent align="end" className="w-80 md:w-96 p-0 shadow-lg" sideOffset={8}>
          <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/30">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-foreground">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  {unreadCount} Active
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground px-2"
              onClick={fetchNotifications}
            >
              Refresh
            </Button>
          </div>

          <div className="max-h-[360px] overflow-y-auto divide-y divide-border">
            {loading && notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Loading alerts...
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500 mb-2 opacity-80" />
                <p className="text-sm font-medium text-foreground">All systems clear</p>
                <p className="text-xs mt-0.5">No pending returns, repairs, or expiring licenses.</p>
              </div>
            ) : (
              notifications.map((item) => (
                <Link
                  key={item.id}
                  href={item.link || "#"}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 p-3.5 text-left transition-colors hover:bg-muted/50 block"
                >
                  <div className="mt-0.5 rounded-md bg-muted p-1.5 shrink-0">
                    {getNotificationIcon(item.type)}
                  </div>
                  <div className="flex-1 space-y-1 overflow-hidden">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                    <p className="text-[10px] text-muted-foreground/80">
                      {formatDateTime(item.timestamp)}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  )
}
