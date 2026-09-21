"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

const ThemeContext = createContext({
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => null,
})

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("system")
  const [resolvedTheme, setResolvedTheme] = useState("light")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("app-theme") || "system"
      setTheme(savedTheme)
    } catch (e) {
      // Ignore localStorage errors
    }
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const root = document.documentElement
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")

    function applyTheme() {
      let active = theme
      if (theme === "system") {
        active = mediaQuery.matches ? "dark" : "light"
      }

      setResolvedTheme(active)

      if (active === "dark") {
        root.classList.add("dark")
      } else {
        root.classList.remove("dark")
      }
    }

    applyTheme()

    const listener = () => {
      if (theme === "system") {
        applyTheme()
      }
    }

    mediaQuery.addEventListener("change", listener)
    return () => mediaQuery.removeEventListener("change", listener)
  }, [theme, mounted])

  const changeTheme = (newTheme) => {
    setTheme(newTheme)
    try {
      localStorage.setItem("app-theme", newTheme)
    } catch (e) {}
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme: changeTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
