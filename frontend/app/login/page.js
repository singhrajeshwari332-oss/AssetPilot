"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ShieldCheck, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, isAuthenticated } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/")
    }
    if (searchParams.get("expired")) {
      setErrorMessage("Your session has expired. Please sign in again.")
    }
  }, [isAuthenticated, router, searchParams])

  const validateForm = () => {
    if (!email || email.trim() === "") {
      setErrorMessage("Please enter your email address.")
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setErrorMessage("Please enter a valid email address.")
      return false
    }

    if (!password || password.trim() === "") {
      setErrorMessage("Please enter your password.")
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage("")

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      await login(email.trim(), password)
      toast.success("Welcome back! Signed in successfully.")
      router.push("/")
    } catch (err) {
      if (err.response) {
        if (err.response.status === 401) {
          setErrorMessage("Invalid email or password.")
        } else if (err.response.data?.message) {
          setErrorMessage(err.response.data.message)
        } else {
          setErrorMessage("Invalid email or password.")
        }
      } else if (err.request) {
        setErrorMessage("Unable to connect to the server. Please try again.")
      } else {
        setErrorMessage("Unable to connect to the server. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const fillDemoCredentials = () => {
    setEmail("admin@company.com")
    setPassword("password123")
    setErrorMessage("")
  }

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Branding */}
      <div className="flex flex-col items-center text-center space-y-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          AssetPilot Enterprise
        </h1>
        <p className="text-xs text-muted-foreground">
          Internal IT Asset, Custody & Software License Portal
        </p>
      </div>

      {/* Login Card */}
      <Card className="border shadow-lg bg-card">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-lg font-semibold">Sign in to your account</CardTitle>
          <CardDescription className="text-xs">
            Enter your corporate credentials to access the inventory system
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <Alert variant="destructive" className="py-2.5 px-3 animate-in fade-in-50 text-xs">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs font-medium ml-2">
                  {errorMessage}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium">
                Email Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (errorMessage) setErrorMessage("")
                }}
                disabled={isLoading}
                autoComplete="email"
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-medium">
                  Password <span className="text-destructive">*</span>
                </Label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errorMessage) setErrorMessage("")
                  }}
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="h-9 pr-10 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-9 font-medium text-xs mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign in to Dashboard"
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 pt-0 border-t bg-muted/10 p-4 rounded-b-lg">
          <div className="flex items-center justify-between w-full text-xs">
            <span className="text-muted-foreground">Demo Admin Account:</span>
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="text-primary font-medium hover:underline cursor-pointer"
            >
              Auto-fill credentials
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground/80 text-center w-full">
            admin@company.com &bull; password123
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4 sm:p-8">
      <Suspense fallback={<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
