"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, MinusCircle, EqualIcon as Equals } from "lucide-react"

interface MonthlySummaryProps {
  userId: string
  year: string
  month: string
}

interface Note {
  text: string
  images: string[]
  returnRate: string
  profitAmount: string
}

export default function MonthlySummary({ userId, year, month }: MonthlySummaryProps) {
  const [totalProfit, setTotalProfit] = useState<number>(0)
  const [positiveProfit, setPositiveProfit] = useState<number>(0)
  const [negativeProfit, setNegativeProfit] = useState<number>(0)
  const [hasData, setHasData] = useState<boolean>(false)

  useEffect(() => {
    // 해당 월의 일수 계산
    const daysInMonth = new Date(Number.parseInt(year), Number.parseInt(month), 0).getDate()

    let totalProfitAmount = 0
    let positiveProfitAmount = 0
    let negativeProfitAmount = 0
    let entriesWithProfit = 0
    let foundData = false

    // 모든 일자의 데이터를 확인
    for (let day = 1; day <= daysInMonth; day++) {
      const key = `note-${userId}-${year}-${month}-${day}`
      const savedNote = localStorage.getItem(key)

      if (savedNote) {
        try {
          const parsedNote = JSON.parse(savedNote) as Note

          if (parsedNote.profitAmount) {
            const profitAmount = Number.parseFloat(parsedNote.profitAmount)
            totalProfitAmount += profitAmount

            if (profitAmount > 0) {
              positiveProfitAmount += profitAmount
            } else if (profitAmount < 0) {
              negativeProfitAmount += Math.abs(profitAmount)
            }

            entriesWithProfit++
            foundData = true
          }
        } catch (error) {
          console.error("Failed to parse saved note:", error)
        }
      }
    }

    // 총 수익금액 설정
    setTotalProfit(totalProfitAmount)
    setPositiveProfit(positiveProfitAmount)
    setNegativeProfit(negativeProfitAmount)
    setHasData(foundData)
  }, [userId, year, month])

  if (!hasData) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-xl">월간 요약</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
            <div className="flex items-center">
              <PlusCircle className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-green-600 font-medium">수익 합계:</span>
              <span className="text-green-600 font-bold ml-2">{formatCurrency(positiveProfit)}</span>
            </div>
            <div className="flex items-center">
              <MinusCircle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-600 font-medium">손실 합계:</span>
              <span className="text-red-600 font-bold ml-2">{formatCurrency(negativeProfit)}</span>
            </div>
            <div className="flex items-center">
              <Equals className="h-5 w-5 mr-2" />
              <span className="font-medium">총 수익금액:</span>
              <span
                className={`font-bold ml-2 ${
                  totalProfit > 0 ? "text-green-600" : totalProfit < 0 ? "text-red-600" : ""
                }`}
              >
                {formatCurrency(totalProfit)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
