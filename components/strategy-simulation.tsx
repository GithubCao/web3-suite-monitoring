"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowRight, Loader2 } from "lucide-react"
import { executeArbitrageQuery } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

interface StrategySimulationProps {
  sourceChain: string
  targetChain: string
  sourceToken: string
  targetToken: string
  initialAmount: string
}

export function StrategySimulation({
  sourceChain,
  targetChain,
  sourceToken,
  targetToken,
  initialAmount,
}: StrategySimulationProps) {
  const [amount, setAmount] = useState(initialAmount)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    sourceOutputAmount: string
    finalOutputAmount: string
    profitPercentage: number
  } | null>(null)
  const { toast } = useToast()

  const runSimulation = async () => {
    setIsLoading(true)
    try {
      const simulationResult = await executeArbitrageQuery(
        sourceChain,
        targetChain,
        sourceToken,
        targetToken,
        amount,
        "0.005",
      )

      setResult({
        sourceOutputAmount: simulationResult.sourceOutputAmount,
        finalOutputAmount: simulationResult.finalOutputAmount,
        profitPercentage: simulationResult.profitPercentage,
      })
    } catch (error) {
      toast({
        title: "模拟失败",
        description: "无法完成套利模拟",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 获取利润颜色
  const getProfitColor = (profit: number) => {
    if (profit > 1.0) return "text-green-500"
    if (profit > 0) return "text-green-400"
    if (profit < 0) return "text-red-500"
    return "text-muted-foreground"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>策略模拟</CardTitle>
        <CardDescription>模拟不同金额下的套利结果</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="space-y-2 flex-1">
              <Label htmlFor="simulation-amount">模拟金额</Label>
              <Input
                id="simulation-amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button onClick={runSimulation} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "模拟中..." : "运行模拟"}
            </Button>
          </div>

          {result && (
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-center space-x-2 text-sm">
                <span>
                  {amount} {sourceToken}
                </span>
                <ArrowRight className="h-4 w-4" />
                <span>
                  {result.sourceOutputAmount} {targetToken}
                </span>
                <ArrowRight className="h-4 w-4" />
                <span>
                  {result.finalOutputAmount} {sourceToken}
                </span>
              </div>

              <div className="text-center">
                <div className="text-sm font-medium">预期利润</div>
                <div className={`text-lg font-bold ${getProfitColor(result.profitPercentage)}`}>
                  {(Number.parseFloat(result.finalOutputAmount) - Number.parseFloat(amount)).toFixed(6)} {sourceToken} (
                  {result.profitPercentage.toFixed(2)}%)
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
