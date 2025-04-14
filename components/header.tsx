"use client"

import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { LogOut, User, Shield } from "lucide-react"

export default function Header() {
  const { user, logout } = useAuth()

  // 관리자 ID 목록 (실제로는 DB에서 관리)
  const adminIds = ["1234"] // 김형석만 관리자
  const isAdmin = user && adminIds.includes(user.userId)

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">
          2025년 Let's go!!
        </Link>
        {user && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{user.name}</span>
            </div>
            {isAdmin && (
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  <Shield className="h-4 w-4 mr-2" />
                  관리자
                </Button>
              </Link>
            )}
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              로그아웃
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
