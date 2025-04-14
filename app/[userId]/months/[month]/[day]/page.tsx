"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Loader2 } from "lucide-react"
import DailyNoteForm from "./daily-note-form"
import ReturnSummary from "./return-summary"
import Header from "@/components/header"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createClientSupabaseClient } from "@/lib/supabase"

interface DayPageProps {
  params: {
    userId: string
    month: string
    day: string
  }
}

export default function DayPage({ params }: DayPageProps) {
  const { userId, month, day } = params
  const [userName, setUserName] = useState<string>("")
  const year = "2025" // 고정된 년도
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const supabase = createClientSupabaseClient()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  // 사용자 정보 가져오기
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        setIsLoadingUser(true)
        const { data, error } = await supabase.from("users").select("name").eq("id", userId).single()

        if (error) {
          console.error("Failed to fetch user info:", error)
          return
        }

        if (data) {
          setUserName(data.name)
        }
      } catch (error) {
        console.error("Error fetching user info:", error)
      } finally {
        setIsLoadingUser(false)
      }
    }

    fetchUserInfo()
  }, [userId, supabase])

  if (isLoading || isLoadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <p>로딩 중...</p>
      </div>
    )
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
