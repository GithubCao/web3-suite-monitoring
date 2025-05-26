"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { executeArbitrageQuery, executeArbitrageTrade } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import type { Strategy } from "@/lib/types"
import { ArbitrageFlowDiagram } from "./arbitrage-flow-diagram"

interface TradeExecutionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  strategy: Strategy
  sourcePrice: number
  targetPrice: number
  profitPercentage: number
}

export function TradeExecutionDialog({
  open,
  onOpenChange,
  strategy,
  sourcePrice,
  targetPrice,
  profitPercentage,
}: TradeExecutionDialogProps) {
  const [amount, setAmount] = useState(strategy.initialAmount)
  const [isExecuting, setIsExecuting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [arbitrageDetails, setArbitrageDetails] = useState<{
    sourceOutputAmount: string
    finalOutputAmount: string
    updatedProfitPercentage: number
  } | null>(null)
  const { toast } = useToast()

  // 修改交易执行对话框以支持新的策略配置
  useEffect(() => {
    if (open) {
      setAmount(strategy.initialAmount)
      setIsExecuting(false)
      setIsLoading(true)

      // 获取最新的套利详情
      executeArbitrageQuery(
        strategy.sourceChain,
        strategy.targetChain,
        strategy.sourceToken,
        strategy.targetToken,
        strategy.initialAmount,
        strategy.slippage,
      )
        .then((result) => {
          setArbitrageDetails({
            sourceOutputAmount: result.sourceOutputAmount,
            finalOutputAmount: result.finalOutputAmount,
            updatedProfitPercentage: result.profitPercentage,
          })
        })
        .catch((error) => {
          console.error("Error fetching arbitrage details:", error)
          toast({
            title: "获取套利详情失败",
            description: "无法获取最新的套利交易详情",
            variant: "destructive",
          })
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [open, strategy, toast])

  // 当金额变化时更新套利详情
  useEffect(() => {
    if (open && amount !== strategy.initialAmount) {
      setIsLoading(true)

      executeArbitrageQuery(
        strategy.sourceChain,
        strategy.targetChain,
        strategy.sourceToken,
        strategy.targetToken,
        amount,
        strategy.slippage,
      )
        .then((result) => {
          setArbitrageDetails({
            sourceOutputAmount: result.sourceOutputAmount,
            finalOutputAmount: result.finalOutputAmount,
            updatedProfitPercentage: result.profitPercentage,
          })
        })
        .catch((error) => {
          console.error("Error updating arbitrage details:", error)
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [amount, open, strategy])

  // 执行交易
  const handleExecuteTrade = async () => {
    setIsExecuting(true)

    try {
      const result = await executeArbitrageTrade(
        strategy.id,
        strategy.name,
        strategy.sourceChain,
        strategy.targetChain,
        strategy.sourceToken,
        strategy.targetToken,
        amount,
        sourcePrice,
        targetPrice,
        arbitrageDetails?.updatedProfitPercentage || profitPercentage,
      )

      if (result.status === "completed") {
        toast({
          title: "交易执行成功",
          description: `成功执行套利交易，获利 ${result.profitAmount} ${strategy.sourceToken}`,
        })
        onOpenChange(false)
      } else {
        toast({
          title: "交易执行失败",
          description: result.error || "未知错误",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "交易执行错误",
        description: "执行交易时发生错误",
        variant: "destructive",
      })
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(value) => !isExecuting && onOpenChange(value)}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>执行套利交易</DialogTitle>
          <DialogDescription>执行 {strategy.name} 策略的套利交易</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">交易金额</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isExecuting || isLoading}
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : arbitrageDetails ? (
            <ArbitrageFlowDiagram
              sourceChain={strategy.sourceChain}
              targetChain={strategy.targetChain}
              sourceToken={strategy.sourceToken}
              targetToken={strategy.targetToken}
              initialAmount={amount}
              sourceOutputAmount={arbitrageDetails.sourceOutputAmount}
              finalOutputAmount={arbitrageDetails.finalOutputAmount}
              profitPercentage={arbitrageDetails.updatedProfitPercentage}
            />
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium mb-1">源链</div>
                <div className="text-sm">
                  {strategy.sourceChain} / {strategy.sourceToken}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium mb-1">目标链</div>
                <div className="text-sm">
                  {strategy.targetChain} / {strategy.targetToken}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium mb-1">源价格</div>
                <div className="text-sm">{sourcePrice.toFixed(8)}</div>
              </div>
              <div>
                <div className="text-sm font-medium mb-1">目标价格</div>
                <div className="text-sm">{targetPrice.toFixed(8)}</div>
              </div>
              <div>
                <div className="text-sm font-medium mb-1">预期利润率</div>
                <div className="text-sm text-green-500 font-bold">{profitPercentage.toFixed(2)}%</div>
              </div>
              <div>
                <div className="text-sm font-medium mb-1">预期利润</div>
                <div className="text-sm text-green-500 font-bold">
                  {((Number.parseFloat(amount) * profitPercentage) / 100).toFixed(4)} {strategy.sourceToken}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExecuting}>
            取消
          </Button>
          <Button
            onClick={handleExecuteTrade}
            disabled={isExecuting || isLoading || (arbitrageDetails && arbitrageDetails.updatedProfitPercentage <= 0)}
          >
            {isExecuting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isExecuting ? "执行中..." : "执行交易"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
