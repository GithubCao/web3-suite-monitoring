"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, RefreshCw } from "lucide-react"
import { getWalletTransactions, type WalletTransaction } from "@/lib/wallet-manager"

interface WalletTransactionHistoryProps {
  walletAddress?: string
  strategyId?: string
}

export function WalletTransactionHistory({ walletAddress, strategyId }: WalletTransactionHistoryProps) {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadTransactions()
  }, [walletAddress, strategyId])

  const loadTransactions = () => {
    setLoading(true)

    try {
      let allTransactions = getWalletTransactions()

      // 按条件过滤
      if (walletAddress) {
        allTransactions = allTransactions.filter((t) => t.walletAddress === walletAddress)
      }

      if (strategyId) {
        allTransactions = allTransactions.filter((t) => t.strategyId === strategyId)
      }

      // 按时间倒序排列
      allTransactions.sort((a, b) => b.timestamp - a.timestamp)

      setTransactions(allTransactions)
    } catch (error) {
      console.error("加载交易记录失败:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const getStatusBadge = (status: WalletTransaction["status"]) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">已完成</Badge>
      case "failed":
        return <Badge variant="destructive">失败</Badge>
      case "pending":
        return <Badge variant="outline">进行中</Badge>
      default:
        return <Badge variant="secondary">未知</Badge>
    }
  }

  const viewTransaction = (txHash: string) => {
    window.open(`https://etherscan.io/tx/${txHash}`, "_blank")
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>钱包交易记录</CardTitle>
            <CardDescription>
              {walletAddress && `钱包: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
              {strategyId && ` | 策略: ${strategyId}`}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadTransactions} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            刷新
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">暂无交易记录</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>时间</TableHead>
                <TableHead>交易对</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>交易哈希</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="text-sm">{formatTime(transaction.timestamp)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>
                        {transaction.sourceToken} → {transaction.targetToken}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {transaction.sourceChain} → {transaction.targetChain}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{transaction.amount}</TableCell>
                  <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                  <TableCell>
                    {transaction.txHash ? (
                      <span className="font-mono text-xs">
                        {transaction.txHash.slice(0, 6)}...{transaction.txHash.slice(-4)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {transaction.txHash && (
                      <Button variant="outline" size="sm" onClick={() => viewTransaction(transaction.txHash!)}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
