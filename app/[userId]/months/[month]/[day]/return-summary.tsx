"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"

interface ReturnSummaryProps {
  userId: string
  year: string
  month: string
  day: string
}

interface Note {
  text: string
  images: string[]
  returnRate: string
  profitAmount: string
}

export default function ReturnSummary({ userId, year, month, day }: ReturnSummaryProps) {
  const [profitAmount, setProfitAmount] = useState<string>("")

  useEffect(() => {
    const key = `note-${userId}-${year}-${month}-${day}`
    const savedNote = localStorage.getItem(key)

    if (savedNote) {
      try {
        const parsedNote = JSON.parse(savedNote) as Note
        setProfitAmount(parsedNote.profitAmount || "")
      } catch (error) {
        console.error("Failed to parse saved note:", error)
      }
    }
  }, [userId, year, month, day])

  // 값이 없으면 요약 정보를 표시하지 않음
  if (!profitAmount) return null

  const profitAmountValue = Number.parseFloat(profitAmount)
  const isProfitPositive = profitAmountValue > 0

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center">
            {isProfitPositive ? (
              <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-600 mr-2" />
            )}
            <div>
              <span className="text-sm text-muted-foreground">수익금액</span>
              <p
                className={`text-xl font-bold ${
                  isProfitPositive ? "text-green-600" : profitAmountValue < 0 ? "text-red-600" : ""
                }`}
              >
                {formatCurrency(profitAmountValue)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
