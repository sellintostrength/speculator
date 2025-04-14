"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, FileText } from "lucide-react"

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState([])

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    try {
      const storedUsers = localStorage.getItem("users")
      if (storedUsers) {
        const parsedUsers = JSON.parse(storedUsers)
        const userInfoList = parsedUsers.map((u) => ({
          id: u.id,
          name: u.name,
        }))
        setUsers(userInfoList)
      }
    } catch (error) {
      console.error("Failed to load users:", error)
    }
  }, [])

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {users.map((userInfo) => (
              <Card key={userInfo.id}>
                <CardHeader>
                  <CardTitle className="text-2xl">{userInfo.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{userInfo.name}님의 노트&코드</p>
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
