"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import DailyNoteForm from "./daily-note-form"
import ReturnSummary from "./return-summary"
import Header from "@/components/header"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { getUserById } from "@/lib/auth"

interface DayPageProps {
  params: {
    userId: string
    month: string
    day: string
  }
}

export default function DayPage({ params }: DayPageProps) {
  const { userId, month, day } = params
  const [userName, setUserName] = useState<string>("사용자")
  const year = "2025" // 고정된 년도
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  // 사용자 정보 가져오기
  useEffect(() => {
    const userInfo = getUserById(userId)
    if (userInfo) {
      setUserName(userInfo.name)
    }
  }, [userId])

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">로딩 중...</div>
  }

  if (!user) {
    return null // 로그인 페이지로 리디렉션됨
  }

  const isOwner = user.userId === userId

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="container mx-auto py-10">
        <div className="flex items-center mb-8">
          <Link href={`/${userId}/months/${month}`}>
            <Button variant="ghost" size="sm" className="gap-1">
              <ChevronLeft className="h-4 w-4" />
              돌아가기
            </Button>
          </Link>
          <h1 className="text-3xl font-bold ml-4">
            {userName}님의 2025년 {month}월 {day}일
          </h1>
          {!isOwner && (
            <span className="ml-4 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">읽기 전용 모드</span>
          )}
        </div>

        <ReturnSummary userId={userId} year={year} month={month} day={day} />

        <div className="max-w-4xl mx-auto">
          <DailyNoteForm userId={userId} year={year} month={month} day={day} isReadOnly={!isOwner} />
        </div>
      </div>
    </div>
  )
}
