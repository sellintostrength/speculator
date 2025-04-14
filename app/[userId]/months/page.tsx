"use client"

import Link from "next/link"
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Loader2 } from "lucide-react"
import Header from "@/components/header"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createClientSupabaseClient } from "@/lib/supabase"

interface MonthsPageProps {
  params: {
    userId: string
  }
}

export default function MonthsPage({ params }: MonthsPageProps) {
  const { userId } = params
  const [userName, setUserName] = useState<string>("")
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
