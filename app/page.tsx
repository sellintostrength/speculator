"use client"

import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, FileText } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import Header from "@/components/header"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface UserInfo {
  id: string
  name: string
}

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<UserInfo[]>([])

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  // 모든 사용자 정보 가져오기
  useEffect(() => {
    try {
      const storedUsers = localStorage.getItem("users")
      if (storedUsers) {
        const parsedUsers = JSON.parse(storedUsers)
        const userInfoList: UserInfo[] = parsedUsers.map((u: any) => ({
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
    return null // 로그인 페이지로 리디렉션됨
  }

  // 사용자 카드를 2개씩 그룹화
  const userGroups = []
  for (let i = 0; i < users.length; i += 2) {
    userGroups.push(users.slice(i, i + 2))
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="container mx-auto py-10 px-4">
        {/* 사용자 카드 - 한 줄에 2개씩 */}
        <div className="max-w-4xl mx-auto mb-8">
          {userGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {group.map((userInfo) => (
                <Card key={userInfo.id} className="w-full">
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
          ))}
        </div>

        {/* 자료실 카드 - 한 줄에 1개 */}
        <div className="max-w-4xl mx-auto">
          <Card className="w-full">
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
