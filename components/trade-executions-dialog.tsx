"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ExternalLink } from "lucide-react"
import type { TradeExecution } from "@/lib/types"
import { getStrategyTradeExecutions } from "@/lib/storage"
import { useState } from "react"

interface TradeExecutionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  strategyId: string
  strategyName: string
}

export function TradeExecutionsDialog({ open, onOpenChange, strategyId, strategyName }: TradeExecutionsDialogProps) {
  const [executions] = useState<TradeExecution[]>(() => getStrategyTradeExecutions(strategyId))

  // 格式化时间
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  // 获取状态标签
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">成功</Badge>
      case "failed":
        return <Badge variant="destructive">失败</Badge>
      case "pending":
        return <Badge variant="outline">处理中</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // 模拟区块浏览器链接
  const getExplorerLink = (txHash: string | undefined, sourceChain: string) => {
    if (!txHash) return null

    // 根据链名称返回不同的区块浏览器URL
    let explorerUrl = ""
    switch (sourceChain) {
      case "ETHEREUM":
        explorerUrl = `https://etherscan.io/tx/${txHash}`
        break
      case "POLYGON":
        explorerUrl = `https://polygonscan.com/tx/${txHash}`
        break
      case "ARBITRUM":
        explorerUrl = `https://arbiscan.io/tx/${txHash}`
        break
      case "BSC":
        explorerUrl = `https://bscscan.com/tx/${txHash}`
        break
      default:
        explorerUrl = `https://example.com/tx/${txHash}`
    }

    return (
      <a
        href={explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center text-blue-500 hover:underline"
      >
        {txHash.substring(0, 6)}...{txHash.substring(txHash.length - 4)}
        <ExternalLink className="ml-1 h-3 w-3" />
      </a>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>交易执行记录</DialogTitle>
          <DialogDescription>策略 "{strategyName}" 的交易执行历史</DialogDescription>
        </DialogHeader>
        {executions.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">暂无交易记录</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>时间</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>利润</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>交易哈希</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {executions.map((execution) => (
                <TableRow key={execution.id}>
                  <TableCell>{formatTime(execution.timestamp)}</TableCell>
                  <TableCell>
                    {execution.amount} {execution.sourceToken}
                  </TableCell>
                  <TableCell className="text-green-500">
                    {execution.profitAmount} ({execution.profitPercentage.toFixed(2)}%)
                  </TableCell>
                  <TableCell>{getStatusBadge(execution.status)}</TableCell>
                  <TableCell>
                    {execution.txHash
                      ? getExplorerLink(execution.txHash, execution.sourceChain)
                      : execution.error || "-"}
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
