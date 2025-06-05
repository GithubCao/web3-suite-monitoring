"use client"

import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, ArrowDown, Repeat } from "lucide-react"

// 修改组件以支持可选的sourceTargetToken和targetSourceToken参数
interface ArbitrageFlowDiagramProps {
  sourceChain: string
  targetChain: string
  sourceToken: string
  targetToken: string
  sourceTargetToken?: string
  targetSourceToken?: string
  amount: string
  initialAmount?: string // 保留initialAmount作为向后兼容
  sourceOutputAmount: string
  finalOutputAmount: string
  profitPercentage: number
}

export function ArbitrageFlowDiagram({
  sourceChain,
  targetChain,
  sourceToken,
  targetToken,
  sourceTargetToken,
  targetSourceToken,
  initialAmount,
  amount,
  sourceOutputAmount,
  finalOutputAmount,
  profitPercentage,
}: ArbitrageFlowDiagramProps) {
  // 如果未提供sourceTargetToken或targetSourceToken，则使用对应的token
  const effectiveSourceTargetToken = sourceTargetToken || targetToken
  const effectiveTargetSourceToken = targetSourceToken || sourceToken
  
  // 使用amount或者fallback到initialAmount以保持向后兼容
  const effectiveAmount = amount || initialAmount || "0"

  // 获取利润颜色
  const getProfitColor = (profit: number) => {
    if (profit > 1.0) return "text-green-500"
    if (profit > 0) return "text-green-400"
    if (profit < 0) return "text-red-500"
    return "text-muted-foreground"
  }

  return (
    <Card className="overflow-hidden border-none shadow-none">
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="grid grid-cols-3 w-full gap-4">
            {/* 源链 */}
            <div className="flex flex-col items-center">
              <div className="text-sm font-medium mb-2">源链</div>
              <div className="bg-blue-50 rounded-lg p-4 w-full text-center">
                <div className="font-bold">{sourceChain}</div>
                <div className="text-sm text-blue-600">
                  {sourceToken} → {effectiveSourceTargetToken}
                </div>
              </div>
            </div>

            {/* 目标链 */}
            <div className="flex flex-col items-center">
              <div className="text-sm font-medium mb-2">目标链</div>
              <div className="bg-blue-50 rounded-lg p-4 w-full text-center">
                <div className="font-bold">{targetChain}</div>
                <div className="text-sm text-blue-600">
                  {targetToken} → {effectiveTargetSourceToken}
                </div>
              </div>
            </div>

            {/* 结果 */}
            <div className="flex flex-col items-center">
              <div className="text-sm font-medium mb-2">结果</div>
              <div className="bg-blue-50 rounded-lg p-4 w-full text-center">
                <div className="font-bold">{sourceChain}</div>
                <div className="text-sm text-blue-600">{sourceToken}</div>
              </div>
            </div>
          </div>

          {/* 箭头和金额 */}
          <div className="grid grid-cols-3 w-full gap-4">
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center h-8">
                <ArrowDown className="h-6 w-6 text-blue-400" />
              </div>
              <div className="bg-white border border-blue-100 rounded-lg p-3 w-full text-center">
                <div className="font-medium">
                  {effectiveAmount} {sourceToken}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center h-8">
                <ArrowDown className="h-6 w-6 text-blue-400" />
              </div>
              <div className="bg-white border border-blue-100 rounded-lg p-3 w-full text-center">
                <div className="font-medium">
                  {sourceOutputAmount} {effectiveSourceTargetToken}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center h-8">
                <ArrowDown className="h-6 w-6 text-blue-400" />
              </div>
              <div className="bg-white border border-blue-100 rounded-lg p-3 w-full text-center">
                <div className="font-medium">
                  {finalOutputAmount} {sourceToken}
                </div>
              </div>
            </div>
          </div>

          {/* 交易流程 */}
          <div className="flex items-center justify-center w-full mt-4 space-x-2">
            <div className="text-sm font-medium">交易流程:</div>
            <div className="flex items-center">
              <span>
                {effectiveAmount} {sourceToken}
              </span>
              <ArrowRight className="mx-1 h-4 w-4 text-blue-500" />
              <span>
                {sourceOutputAmount} {effectiveSourceTargetToken}
              </span>
              <ArrowRight className="mx-1 h-4 w-4 text-blue-500" />
              <span>
                {finalOutputAmount} {sourceToken}
              </span>
            </div>
          </div>

          {/* 利润信息 */}
          <div className="flex items-center justify-center space-x-2 mt-2">
            <Repeat className="h-4 w-4 text-blue-500" />
            <div className="text-sm">
              净利润:
              <span className={`font-bold ml-1 ${getProfitColor(profitPercentage)}`}>
                {(Number.parseFloat(finalOutputAmount) - Number.parseFloat(effectiveAmount)).toFixed(6)} {sourceToken} (
                {profitPercentage.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
