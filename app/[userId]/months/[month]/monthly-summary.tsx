"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, MinusCircle, EqualIcon as Equals } from "lucide-react"
import { createClientSupabaseClient } from "@/lib/supabase"

interface MonthlySummaryProps {
  userId: string
  year: string
  month: string
}

export default function MonthlySummary({ userId, year, month }: MonthlySummaryProps) {
  const [totalProfit, setTotalProfit] = useState<number>(0)
  const [positiveProfit, setPositiveProfit] = useState<number>(0)
  const [negativeProfit, setNegativeProfit] = useState<number>(0)
  const [hasData, setHasData] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const supabase = createClientSupabaseClient()

  useEffect(() => {
    const fetchMonthlySummary = async () => {
      try {
        setIsLoading(true)

        // 해당 월의 모든 노트 데이터 가져오기
        const { data, error } = await supabase
          .from("investment_notes")
          .select("profit_amount")
          .eq("user_id", userId)
          .eq("year", Number.parseInt(year))
          .eq("month", Number.parseInt(month))
          .not("profit_amount", "is", null)

        if (error) {
          console.error("Failed to fetch monthly data:", error)
          return
        }

        if (data && data.length > 0) {
          let totalProfitAmount = 0
          let positiveProfitAmount = 0
          let negativeProfitAmount = 0

          data.forEach((note) => {
            if (note.profit_amount) {
              const profitAmount = Number.parseFloat(note.profit_amount)
              totalProfitAmount += profitAmount

              if (profitAmount > 0) {
                positiveProfitAmount += profitAmount
              } else if (profitAmount < 0) {
                negativeProfitAmount += Math.abs(profitAmount)
              }
            }
          })

          setTotalProfit(totalProfitAmount)
          setPositiveProfit(positiveProfitAmount)
          setNegativeProfit(negativeProfitAmount)
          setHasData(true)
        } else {
          setHasData(false)
        }
      } catch (error) {
        console.error("Error fetching monthly summary:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMonthlySummary()
  }, [userId, year, month, supabase])

  if (isLoading || !hasData) return null

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
