import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function UnauthorizedPage() {
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <AlertTriangle className="h-16 w-16 text-yellow-500" />
        </div>
        <h1 className="text-3xl font-bold">접근 권한이 없습니다</h1>
        <p className="text-muted-foreground">
          요청하신 페이지에 접근할 권한이 없습니다. 자신의 계정에 해당하는 페이지만 접근할 수 있습니다.
        </p>
        <div className="pt-4">
          <Link href="/">
            <Button>홈으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
