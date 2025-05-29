"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { PriceHistoryRecord } from "@/lib/types"
import { getStrategyPriceHistory } from "@/lib/storage"
import { Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PriceHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  strategyId: string
  strategyName: string
}

export function PriceHistoryDialog({ open, onOpenChange, strategyId, strategyName }: PriceHistoryDialogProps) {
  const [priceHistory, setPriceHistory] = useState<PriceHistoryRecord[]>([])
  const [loading, setLoading] = useState(true)

  // 加载价格历史数据
  useEffect(() => {
    if (open) {
      loadPriceHistory()
    }
  }, [open, strategyId])

  const loadPriceHistory = () => {
    setLoading(true)
    // 获取价格历史记录
    const history = getStrategyPriceHistory(strategyId)
    setPriceHistory(history)
    setLoading(false)
  }

  // 格式化时间
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  // 获取利润颜色
  const getProfitColor = (profit: number) => {
    if (profit > 1.0) return "text-green-500 font-bold"
    if (profit > 0) return "text-green-400"
    if (profit < 0) return "text-red-500"
    return ""
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div>
            <DialogTitle>价格历史记录</DialogTitle>
            <DialogDescription>策略 "{strategyName}" 的最近10条价格记录</DialogDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadPriceHistory}>
            <RefreshCw className="mr-2 h-4 w-4" />
            刷新数据
          </Button>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : priceHistory.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">暂无历史数据。请确保策略已启动并监控了一段时间。</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>时间</TableHead>
                <TableHead>源价格</TableHead>
                <TableHead>目标价格</TableHead>
                <TableHead>利润 (%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {priceHistory.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{formatTime(record.timestamp)}</TableCell>
                  <TableCell>{record.sourceOutputAmount}</TableCell>
                  <TableCell>{record.finalOutputAmount}</TableCell>
                  <TableCell className={getProfitColor(record.profitPercentage)}>
                    {record.profitPercentage.toFixed(2)}%
                    {record.profitPercentage > 1.0 && (
                      <Badge variant="outline" className="ml-2 bg-green-500/10">
                        套利机会
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  )
}
