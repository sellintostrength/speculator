"use client"

import Link from "next/link"
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Header from "@/components/header"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { getUserById } from "@/lib/auth"

interface MonthsPageProps {
  params: {
    userId: string
  }
}

export default function MonthsPage({ params }) {
  const { userId } = params
  const [userName, setUserName] = useState("사용자")
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

  // 1월부터 12월까지
  const months = [
    { number: 1, name: "1월" },
    { number: 2, name: "2월" },
    { number: 3, name: "3월" },
    { number: 4, name: "4월" },
    { number: 5, name: "5월" },
    { number: 6, name: "6월" },
    { number: 7, name: "7월" },
    { number: 8, name: "8월" },
    { number: 9, name: "9월" },
    { number: 10, name: "10월" },
    { number: 11, name: "11월" },
    { number: 12, name: "12월" },
  ]

  const isOwner = user.userId === userId

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
          <h1 className="text-3xl font-bold ml-4">{userName}님의 2025년</h1>
          {!isOwner && (
            <span className="ml-4 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">읽기 전용 모드</span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {months.map((month) => (
            <Card key={month.number}>
              <CardHeader>
                <CardTitle className="text-xl">{month.name}</CardTitle>
              </CardHeader>
              <CardFooter>
                <Link href={`/${userId}/months/${month.number}`} className="w-full">
                  <Button className="w-full">보기</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
