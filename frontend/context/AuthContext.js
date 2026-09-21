"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import api from "@/services/api"

const AuthContext = createContext({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: () => {},
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadStoredAuth() {
      try {
        const storedToken = localStorage.getItem("token")
        const storedUser = localStorage.getItem("user")

        if (storedToken && storedUser) {
          setToken(storedToken)
          setUser(JSON.parse(storedUser))
          
          // Verify with backend silently
          try {
            const res = await api.get("/auth/me")
            if (res.data?.user) {
              setUser(res.data.user)
              localStorage.setItem("user", JSON.stringify(res.data.user))
            }
          } catch (e) {
            // Token is invalid/expired
            localStorage.removeItem("token")
            localStorage.removeItem("user")
            setUser(null)
            setToken(null)
          }
        }
      } catch (err) {
        console.error("Auth initialization error:", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadStoredAuth()
  }, [])

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password })
    const { token: receivedToken, user: receivedUser } = res.data

    localStorage.setItem("token", receivedToken)
    localStorage.setItem("user", JSON.stringify(receivedUser))

    setToken(receivedToken)
    setUser(receivedUser)

    return res.data
  }

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setUser(null)
    setToken(null)
    router.push("/login")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
