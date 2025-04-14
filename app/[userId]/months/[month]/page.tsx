"use client"

import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import MonthlySummary from "./monthly-summary"
import Header from "@/components/header"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { getUserById } from "@/lib/auth"

interface MonthPageProps {
  params: {
    userId: string
    month: string
  }
}

interface Note {
  text: string
  images: string[]
  returnRate: string
  profitAmount: string
}

interface DaySummary {
  day: number
  returnRate: string
  profitAmount: string
  hasData: boolean
}

export default function MonthPage({ params }: MonthPageProps) {
  const { userId, month } = params
  const [userName, setUserName] = useState<string>("사용자")
  const year = "2025" // 고정된 년도
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [daySummaries, setDaySummaries] = useState<DaySummary[]>([])

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

  useEffect(() => {
    // 해당 월의 일수 계산
    const daysInMonth = new Date(Number.parseInt(year), Number.parseInt(month), 0).getDate()
    const summaries: DaySummary[] = []

    // 모든 일자의 데이터를 확인
    for (let day = 1; day <= daysInMonth; day++) {
      const key = `note-${userId}-${year}-${month}-${day}`
      const savedNote = localStorage.getItem(key)
      let summary: DaySummary = {
        day,
        returnRate: "",
        profitAmount: "",
        hasData: false,
      }

      if (savedNote) {
        try {
          const parsedNote = JSON.parse(savedNote) as Note
          summary = {
            day,
            returnRate: parsedNote.returnRate || "",
            profitAmount: parsedNote.profitAmount || "",
            hasData: !!(parsedNote.returnRate || parsedNote.profitAmount),
          }
        } catch (error) {
          console.error("Failed to parse saved note:", error)
        }
      }

      summaries.push(summary)
    }

    setDaySummaries(summaries)
  }, [userId, year, month])

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">로딩 중...</div>
  }

  if (!user) {
    return null // 로그인 페이지로 리디렉션됨
  }

  const isOwner = user.userId === userId

  // 해당 월의 일수 계산
  const daysInMonth = new Date(Number.parseInt(year), Number.parseInt(month), 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  const formatCurrency = (amount: string) => {
    if (!amount) return ""
    const value = Number.parseFloat(amount)
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
      signDisplay: "never", // 부호 표시 안함
    }).format(Math.abs(value)) // 절대값 사용
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="container mx-auto py-10">
        <div className="flex items-center mb-8">
          <Link href={`/${userId}/months`}>
            <Button variant="ghost" size="sm" className="gap-1">
              <ChevronLeft className="h-4 w-4" />
              돌아가기
            </Button>
          </Link>
          <h1 className="text-3xl font-bold ml-4">
            {userName}님의 2025년 {month}월
          </h1>
          {!isOwner && (
            <span className="ml-4 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">읽기 전용 모드</span>
          )}
        </div>

        <MonthlySummary userId={userId} year="2025" month={month} />

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4">
          {daySummaries.map((summary) => (
            <Card key={summary.day} className="w-full">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-lg">{summary.day}일</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 pb-2">
                {summary.hasData && summary.profitAmount && (
                  <div className="text-xs">
                    <span
                      className={`${
                        Number.parseFloat(summary.profitAmount) > 0
                          ? "text-green-600"
                          : Number.parseFloat(summary.profitAmount) < 0
                            ? "text-red-600"
                            : ""
                      }`}
                    >
                      {Number.parseFloat(summary.profitAmount) > 0 ? "+" : ""}
                      {formatCurrency(summary.profitAmount)}
                    </span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Link href={`/${userId}/months/${month}/${summary.day}`} className="w-full">
                  <Button className="w-full" size="sm">
                    기록 보기
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
