"use client"

import { useState, useEffect, useRef } from "react"
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
  // 添加空值检查，如果策略为空则不渲染
  const [amount, setAmount] = useState<string>(strategy?.amount || "")
  const [isExecuting, setIsExecuting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [arbitrageDetails, setArbitrageDetails] = useState<{
    sourceOutputAmount: string
    finalOutputAmount: string
    updatedProfitPercentage: number
  } | null>(null)
  const { toast } = useToast()
  const isFirstRender = useRef(true)

  if (!strategy) {
    return null
  }

  // 修改交易执行对话框以支持新的策略配置
  useEffect(() => {
    if (open && strategy) {
      // 添加 strategy 检查
      setAmount(strategy.amount)
      setIsExecuting(false)
      setIsLoading(true)

      // 获取最新的套利详情
      executeArbitrageQuery(
        strategy.sourceChain,
        strategy.targetChain,
        strategy.sourceToken,
        strategy.targetToken,
        strategy.amount,
        strategy.slippage || "0.005", // 使用默认值
        strategy.preferredApiProvider,
        strategy.fallbackApiProviders,
        strategy.gasFee,
        strategy.networkFee,
        strategy.bridgeFee,
        strategy.dexFee,
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
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    if (open && strategy && amount !== strategy.amount) {
      // 添加 strategy 检查
      setIsLoading(true)

      executeArbitrageQuery(
        strategy.sourceChain,
        strategy.targetChain,
        strategy.sourceToken,
        strategy.targetToken,
        amount,
        strategy.slippage || "0.005", // 使用默认值
        strategy.preferredApiProvider,
        strategy.fallbackApiProviders,
        strategy.gasFee,
        strategy.networkFee,
        strategy.bridgeFee,
        strategy.dexFee,
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>执行套利交易</DialogTitle>
          <DialogDescription>确认交易详情并调整金额，然后点击执行</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">交易金额</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isExecuting || isLoading}
            />
          </div>

          <div className="mt-4 space-y-4">
            <h3 className="text-sm font-medium">套利详情</h3>
            {isLoading ? (
              <div className="flex justify-center items-center h-[150px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : arbitrageDetails ? (
              <ArbitrageFlowDiagram
                sourceChain={strategy.sourceChain}
                targetChain={strategy.targetChain}
                sourceToken={strategy.sourceToken}
                targetToken={strategy.targetToken}
                amount={amount}
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExecuting}>
            取消
          </Button>
          <Button onClick={handleExecuteTrade} disabled={isExecuting || isLoading}>
            {isExecuting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                执行中...
              </>
            ) : (
              "执行交易"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
