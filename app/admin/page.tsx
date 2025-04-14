"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { addUser } from "@/lib/auth"
import Header from "@/components/header"
import Link from "next/link"
import { ChevronLeft, UserPlus } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function AdminPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // 관리자 ID 목록 (실제로는 DB에서 관리)
  const adminIds = ["1234"] // 김형석만 관리자

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">로딩 중...</div>
  }

  if (!user || !adminIds.includes(user.userId)) {
    // 관리자가 아니면 접근 불가
    router.push("/unauthorized")
    return null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // 입력 검증
    if (!name || !email || !phone) {
      setMessage({ type: "error", text: "모든 필드를 입력해주세요." })
      return
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setMessage({ type: "error", text: "유효한 이메일 주소를 입력해주세요." })
      return
    }

    // 전화번호 형식 검증
    const phoneRegex = /^[0-9]{2,3}-[0-9]{3,4}-[0-9]{4}$/
    if (!phoneRegex.test(phone)) {
      setMessage({ type: "error", text: "��화번호 형식은 010-1234-5678 형태로 입력해주세요." })
      return
    }

    // 사용자 추가
    const success = addUser(name, email, phone)

    if (success) {
      setMessage({
        type: "success",
        text: `사용자가 추가되었습니다. 로그인 정보: 이메일 ${email}, 비밀번호 ${phone.slice(-4)}`,
      })
      setName("")
      setEmail("")
      setPhone("")
    } else {
      setMessage({ type: "error", text: "사용자 추가에 실패했습니다. 이미 존재하는 이메일일 수 있습니다." })
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="container mx-auto py-10">
        <div className="flex items-center mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-1">
              <ChevronLeft className="h-4 w-4" />
              돌아가기
            </Button>
          </Link>
          <h1 className="text-3xl font-bold ml-4">관리자 페이지</h1>
        </div>

        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>사용자 추가</CardTitle>
              <CardDescription>새로운 사용자를 시스템에 추가합니다.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {message && (
                  <Alert variant={message.type === "error" ? "destructive" : "default"}>
                    <AlertDescription>{message.text}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="name">이름</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="사용자 이름" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">이메일</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">전화번호</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="010-1234-5678"
                  />
                  <p className="text-xs text-muted-foreground">전화번호 마지막 4자리가 비밀번호로 사용됩니다.</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full">
                  <UserPlus className="h-4 w-4 mr-2" />
                  사용자 추가
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
