"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, FileText, Loader2 } from "lucide-react"
import { createClientSupabaseClient } from "@/lib/supabase"

interface UserInfo {
  id: string
  name: string
}

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<UserInfo[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const supabase = createClientSupabaseClient()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  // Supabase에서 사용자 목록 가져오기
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoadingUsers(true)
        const { data, error } = await supabase.from("users").select("id, name")

        if (error) {
          console.error("Failed to fetch users:", error)
          return
        }

        if (data) {
          // 사용자 정렬: 김형석이 첫 번째, 고지웅이 두 번째로 오도록 정렬
          const sortedUsers = [...data].sort((a, b) => {
            if (a.name === "김형석") return -1
            if (b.name === "김형석") return 1
            if (a.name === "고지웅") return 1
            if (b.name === "고지웅") return -1
            return a.name.localeCompare(b.name)
          })

          setUsers(sortedUsers)
        }
      } catch (error) {
        console.error("Error fetching users:", error)
      } finally {
        setIsLoadingUsers(false)
      }
    }

    if (user) {
      fetchUsers()
    }
  }, [user, supabase])

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">로딩 중...</div>
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="container mx-auto py-10 px-4">
        <div className="max-w-4xl mx-auto mb-8">
          {isLoadingUsers ? (
            <div className="flex items-center justify-center p-10">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <p>사용자 목록 로딩 중...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {users.map((userInfo) => (
                <Card key={userInfo.id}>
                  <CardHeader>
                    <CardTitle className="text-2xl">{userInfo.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{userInfo.name}님 달려봅시다.</p>
                  </CardContent>
                  <CardFooter>
                    <Link href={`/${userInfo.id}/months`} className="w-full">
                      <Button className="w-full">
                        <BookOpen className="h-4 w-4 mr-2" />
                        {user.userId === userInfo.id ? "입장하기" : "보기"}
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">자료실</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                투자 분석 보고서, 시장 동향 자료, 투자 전략 문서 등 다양한 PDF 파일 업로드
              </p>
            </CardContent>
            <CardFooter>
              <Link href="/resources" className="w-full">
                <Button className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  자료실 입장
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
