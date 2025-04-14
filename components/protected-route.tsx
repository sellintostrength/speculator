"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedUserIds?: string[]
}

export default function ProtectedRoute({ children, allowedUserIds }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    } else if (!isLoading && user && allowedUserIds && !allowedUserIds.includes(user.userId)) {
      router.push("/unauthorized")
    }
  }, [user, isLoading, router, allowedUserIds])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p>로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (allowedUserIds && !allowedUserIds.includes(user.userId)) {
    return null
  }

  return <>{children}</>
}
