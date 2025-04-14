"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { createClientSupabaseClient } from "@/lib/supabase"

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
  const supabase = createClientSupabaseClient()

  useEffect(() => {
    // 현재 로그인한 사용자 확인
    const checkCurrentUser = async () => {
      try {
        setIsLoading(true)
        // 로컬 스토리지에서 세션 확인
        const sessionData = localStorage.getItem("session")

        if (sessionData) {
          try {
            const userData = JSON.parse(sessionData)
            setUser({
              userId: userData.userId,
              username: userData.username,
              name: userData.name,
            })
          } catch (error) {
            console.error("Failed to parse session data:", error)
            localStorage.removeItem("session") // 잘못된 세션 데이터 삭제
          }
        }
      } catch (error) {
        console.error("Failed to get current user:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkCurrentUser()
  }, [])

  const login = async (username: string, password: string) => {
    try {
      // 사용자 정보 확인
      const { data: userData, error } = await supabase
        .from("users")
        .select("id, username, name, email")
        .eq("username", username)
        .eq("id", password) // 비밀번호는 전화번호 마지막 4자리(id)
        .single()

      if (error) {
        console.error("Login query error:", error)
        return false
      }

      if (userData) {
        // 세션 생성 (Supabase Auth를 사용하지 않고 자체 세션 관리)
        localStorage.setItem(
          "session",
          JSON.stringify({
            userId: userData.id,
            username: userData.username,
            name: userData.name,
            email: userData.email,
          }),
        )

        setUser({
          userId: userData.id,
          username: userData.username,
          name: userData.name,
        })

        return true
      }

      return false
    } catch (error) {
      console.error("Login failed:", error)
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem("session")
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
