"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Loader2 } from "lucide-react"
import { fetchMultiDexPrices } from "@/lib/api"
import type { PriceQuote } from "@/lib/types"

interface MultiDexPriceComparisonProps {
  chainName: string
  tokenInSymbol: string
  tokenOutSymbol: string
  amount: string
}

interface DexPriceData {
  dex: string
  price: number
  quote: PriceQuote | null
}

export function MultiDexPriceComparison({
  chainName,
  tokenInSymbol,
  tokenOutSymbol,
  amount,
}: MultiDexPriceComparisonProps) {
  const [prices, setPrices] = useState<DexPriceData[]>([])
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)

  const fetchPrices = async () => {
    if (!chainName || !tokenInSymbol || !tokenOutSymbol || !amount) return

    setLoading(true)
    try {
      const results = await fetchMultiDexPrices(chainName, tokenInSymbol, tokenOutSymbol, amount)
      setPrices(results)
      setLastUpdated(Date.now())
    } catch (error) {
      console.error("Error fetching multi-DEX prices:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPrices()
  }, [chainName, tokenInSymbol, tokenOutSymbol, amount])

  const getBestPrice = () => {
    if (prices.length === 0) return null
    return prices.reduce((best, current) => (current.price > best.price ? current : best))
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const bestPrice = getBestPrice()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>DEX 价格比较</span>
          <Button variant="outline" size="sm" onClick={fetchPrices} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            刷新价格
          </Button>
        </CardTitle>
        <CardDescription>
          {chainName} 上 {tokenInSymbol} → {tokenOutSymbol} 的价格比较
          {lastUpdated && <span className="ml-2">• 更新时间: {formatTime(lastUpdated)}</span>}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading && prices.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : prices.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">暂无价格数据</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>DEX</TableHead>
                <TableHead>价格</TableHead>
                <TableHead>输出金额</TableHead>
                <TableHead>价格影响</TableHead>
                <TableHead>Gas 费用</TableHead>
                <TableHead>状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prices.map((priceData, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {priceData.dex}
                    {bestPrice && priceData.dex === bestPrice.dex && (
                      <Badge variant="default" className="ml-2 bg-green-100 text-green-800">
                        最佳
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{priceData.price.toFixed(8)}</TableCell>
                  <TableCell>
                    {priceData.quote ? (
                      <>
                        {Number.parseFloat(priceData.quote.assumedAmountOut).toFixed(6)} {tokenOutSymbol}
                      </>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>{priceData.quote ? `${(priceData.quote.priceImpact * 100).toFixed(3)}%` : "-"}</TableCell>
                  <TableCell>{priceData.quote ? `${priceData.quote.gasSpent.toLocaleString()} gas` : "-"}</TableCell>
                  <TableCell>
                    <Badge variant={priceData.quote ? "default" : "destructive"}>
                      {priceData.quote ? "可用" : "不可用"}
                    </Badge>
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
