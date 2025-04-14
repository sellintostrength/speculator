"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { getCurrentUser, loginUser, logoutUser, setupInitialUsers } from "@/lib/auth"
import { useRouter } from "next/navigation"

interface AuthContextType {
  user: { userId: string; username: string; name: string } | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<{ userId: string; username: string; name: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // 초기 사용자 설정
    setupInitialUsers()

    // 현재 로그인한 사용자 확인
    const currentUser = getCurrentUser()
    setUser(currentUser)
    setIsLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    const loggedInUser = loginUser(username, password)
    if (loggedInUser) {
      setUser({
        userId: loggedInUser.id,
        username: loggedInUser.username,
        name: loggedInUser.name,
      })
      return true
    }
    return false
  }

  const logout = () => {
    logoutUser()
    setUser(null)
    router.push("/login")
  }

  return <AuthContext.Provider value={{ user, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
