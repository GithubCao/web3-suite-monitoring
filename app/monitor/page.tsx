"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { Strategy, ArbitrageOpportunity, PriceHistoryRecord } from "@/lib/types"
import { getStrategies, updateStrategyStatus, addPriceHistoryRecord } from "@/lib/storage"
import { executeArbitrageQuery, calculateProfitPercentage, executeArbitrageTrade } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { AlertCircle, Play, Square, RefreshCw, History, Route, Zap, Settings, FileText } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PriceHistoryDialog } from "@/components/price-history-dialog"
import { RouteDetailsDialog } from "@/components/route-details-dialog"
import { TradeExecutionDialog } from "@/components/trade-execution-dialog"
import { AutoTradeDialog } from "@/components/auto-trade-dialog"
import { TradeExecutionsDialog } from "@/components/trade-executions-dialog"
import { DashboardStats } from "@/components/dashboard-stats"

export default function MonitorPage() {
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [activeStrategies, setActiveStrategies] = useState<Strategy[]>([])
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [nextUpdate, setNextUpdate] = useState(3)
  const [loading, setLoading] = useState(false)
  const [selectedStrategy, setSelectedStrategy] = useState<string>("all")
  const [updateInterval, setUpdateInterval] = useState(3)
  const { toast } = useToast()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // 对话框状态
  const [priceHistoryDialog, setPriceHistoryDialog] = useState({ open: false, strategyId: "", strategyName: "" })
  const [routeDetailsDialog, setRouteDetailsDialog] = useState({
    open: false,
    sourceChain: "",
    targetChain: "",
    sourceRoute: undefined as any,
    targetRoute: undefined as any,
  })
  const [tradeExecutionDialog, setTradeExecutionDialog] = useState({
    open: false,
    strategy: null as Strategy | null,
    sourcePrice: 0,
    targetPrice: 0,
    profitPercentage: 0,
  })
  const [autoTradeDialog, setAutoTradeDialog] = useState({
    open: false,
    strategy: null as Strategy | null,
  })
  const [tradeExecutionsDialog, setTradeExecutionsDialog] = useState({
    open: false,
    strategyId: "",
    strategyName: "",
  })

  // 加载策略
  useEffect(() => {
    const loadStrategies = () => {
      const allStrategies = getStrategies()
      setStrategies(allStrategies)

      const active = allStrategies.filter((s) => s.isActive)
      setActiveStrategies(active)

      if (active.length > 0 && !isMonitoring) {
        setIsMonitoring(true)
      } else if (active.length === 0 && isMonitoring) {
        setIsMonitoring(false)
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    }

    loadStrategies()

    // 设置定时刷新
    const refreshInterval = setInterval(loadStrategies, 5000)

    return () => {
      clearInterval(refreshInterval)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isMonitoring])

  // 监控价格
  useEffect(() => {
    if (activeStrategies.length === 0) return

    let countdownInterval: NodeJS.Timeout | null = null

    const startMonitoring = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }

      // 立即执行一次
      checkPrices()

      // 设置定时器
      intervalRef.current = setInterval(() => {
        checkPrices()
      }, updateInterval * 1000)

      // 倒计时更新
      countdownInterval = setInterval(() => {
        setNextUpdate((prev) => {
          if (prev <= 1) {
            return updateInterval
          }
          return prev - 1
        })
      }, 1000)
    }

    startMonitoring()

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      if (countdownInterval) {
        clearInterval(countdownInterval)
      }
    }
  }, [activeStrategies, updateInterval])

  // 检查价格
  const checkPrices = async () => {
    if (activeStrategies.length === 0 || loading) return

    setLoading(true)

    try {
      const newOpportunities: ArbitrageOpportunity[] = []

      for (const strategy of activeStrategies) {
        try {
          // 执行套利查询
          const result = await executeArbitrageQuery(
            strategy.sourceChain,
            strategy.targetChain,
            strategy.sourceToken,
            strategy.targetToken,
            strategy.initialAmount,
            strategy.slippage,
            strategy.preferredApiProvider,
            strategy.fallbackApiProviders,
            strategy.gasFee,
            strategy.networkFee,
            strategy.bridgeFee,
            strategy.dexFee
          )

          // 使用API返回的净利润百分比，不再需要单独计算
          const netProfitPercentage = result.netProfitPercentage
          console.log(`result : ${JSON.stringify(result)} `);
          // 添加到机会列表
          const opportunity: ArbitrageOpportunity = {
            strategyId: strategy.id,
            strategyName: strategy.name,
            sourceChain: strategy.sourceChain,
            targetChain: strategy.targetChain,
            sourcePrice: result.sourcePrice,
            targetPrice: result.targetPrice,
            sourceOutputAmount: result.sourceOutputAmount,
            finalOutputAmount: result.finalOutputAmount,
            profitPercentage: netProfitPercentage,
            timestamp: Date.now(),
            sourceRoute: result.sourceRoute,
            targetRoute: result.targetRoute,
          }

          newOpportunities.push(opportunity)

          // 保存价格历史记录
          const historyRecord: PriceHistoryRecord = {
            id: crypto.randomUUID(),
            strategyId: strategy.id,
            sourcePrice: result.sourcePrice,
            targetPrice: result.targetPrice,
            sourceOutputAmount: result.sourceOutputAmount,
            finalOutputAmount: result.finalOutputAmount,
            profitPercentage: netProfitPercentage,
            timestamp: Date.now(),
          }
          addPriceHistoryRecord(historyRecord)

          // 如果利润超过阈值，发送通知
          if (netProfitPercentage > 1.0) {
            toast({
              title: "发现套利机会!",
              description: `策略 ${strategy.name} 发现 ${netProfitPercentage.toFixed(2)}% 的套利机会`,
              variant: "default",
            })

            // 如果启用了自动交易且利润超过设定阈值，执行交易
            if (
              strategy.autoTrade &&
              strategy.minProfitPercentage &&
              netProfitPercentage >= Number.parseFloat(strategy.minProfitPercentage)
            ) {
              executeArbitrageTrade(
                strategy.id,
                strategy.name,
                strategy.sourceChain,
                strategy.targetChain,
                strategy.sourceToken,
                strategy.targetToken,
                strategy.initialAmount,
                result.sourcePrice,
                result.targetPrice,
                netProfitPercentage,
              ).then((result) => {
                if (result.status === "completed") {
                  toast({
                    title: "自动交易执行成功",
                    description: `策略 ${strategy.name} 自动执行套利交易，获利 ${result.profitAmount} ${strategy.sourceToken}`,
                  })
                } else {
                  toast({
                    title: "自动交易执行失败",
                    description: result.error || "未知错误",
                    variant: "destructive",
                  })
                }
              })
            }
          }
        } catch (error) {
          console.error(`Error checking prices for strategy ${strategy.name}:`, error)
        }
      }

      // 更新机会列表
      setOpportunities(newOpportunities)
    } catch (error) {
      console.error("Error checking prices:", error)
    } finally {
      setLoading(false)
    }
  }

  // 启动/停止所有策略
  const toggleAllStrategies = (active: boolean) => {
    const updatedStrategies = strategies.map((s) => {
      updateStrategyStatus(s.id, active)
      return { ...s, isActive: active }
    })

    setStrategies(updatedStrategies)
    setActiveStrategies(active ? updatedStrategies : [])

    toast({
      title: active ? "已启动所有策略" : "已停止所有策略",
      description: active ? "所有套利策略监控已启动" : "所有套利策略监控已停止",
    })
  }

  // 切换单个策略状态
  const toggleStrategy = (id: string, currentStatus: boolean) => {
    updateStrategyStatus(id, !currentStatus)

    setStrategies(strategies.map((s) => (s.id === id ? { ...s, isActive: !currentStatus } : s)))

    if (currentStatus) {
      setActiveStrategies(activeStrategies.filter((s) => s.id !== id))
    } else {
      const strategy = strategies.find((s) => s.id === id)
      if (strategy) {
        setActiveStrategies([...activeStrategies, { ...strategy, isActive: true }])
      }
    }

    toast({
      title: currentStatus ? "策略已停止" : "策略已启动",
      description: currentStatus ? "套利策略监控已停止" : "套利策略监控已启动",
    })
  }

  // 手动刷新价格
  const handleManualRefresh = () => {
    checkPrices()
    toast({
      title: "正在刷新价格",
      description: "正在获取最新的价格数据",
    })
  }

  // 更改更新间隔
  const handleIntervalChange = (value: string) => {
    const interval = Number.parseInt(value, 10)
    setUpdateInterval(interval)
    setNextUpdate(interval)

    toast({
      title: "更新间隔已修改",
      description: `价格更新间隔已设置为 ${interval} 秒`,
    })
  }

  // 打开价格历史对话框
  const openPriceHistory = (strategyId: string, strategyName: string) => {
    setPriceHistoryDialog({
      open: true,
      strategyId,
      strategyName,
    })
  }

  // 打开交易路径详情对话框
  const openRouteDetails = (opportunity: ArbitrageOpportunity) => {
    setRouteDetailsDialog({
      open: true,
      sourceChain: opportunity.sourceChain,
      targetChain: opportunity.targetChain,
      sourceRoute: opportunity.sourceRoute,
      targetRoute: opportunity.targetRoute,
    })
  }

  // 打开交易执行对话框
  const openTradeExecution = (opportunity: ArbitrageOpportunity) => {
    const strategy = strategies.find((s) => s.id === opportunity.strategyId)
    if (strategy) {
      setTradeExecutionDialog({
        open: true,
        strategy,
        sourcePrice: opportunity.sourcePrice,
        targetPrice: opportunity.targetPrice,
        profitPercentage: opportunity.profitPercentage,
      })
    }
  }

  // 打开自动交易设置对话框
  const openAutoTradeSettings = (strategy: Strategy) => {
    setAutoTradeDialog({
      open: true,
      strategy,
    })
  }

  // 打开交易执行记录对话框
  const openTradeExecutions = (strategyId: string, strategyName: string) => {
    setTradeExecutionsDialog({
      open: true,
      strategyId,
      strategyName,
    })
  }

  // 格式化时间
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  // 获取利润颜色
  const getProfitColor = (profit: number) => {
    if (profit > 1.0) return "text-green-500 font-bold"
    if (profit > 0) return "text-green-400"
    if (profit < 0) return "text-red-500"
    return ""
  }
 
  // 过滤机会
  const filteredOpportunities =
    selectedStrategy === "all" ? opportunities : opportunities.filter((o) => o.strategyId === selectedStrategy)
 
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">监控中心</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleManualRefresh} disabled={activeStrategies.length === 0}>
            <RefreshCw className="mr-2 h-4 w-4" />
            刷新价格
          </Button>
          {isMonitoring ? (
            <Button variant="destructive" onClick={() => toggleAllStrategies(false)}>
              <Square className="mr-2 h-4 w-4" />
              停止所有监控
            </Button>
          ) : (
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => toggleAllStrategies(true)}>
              <Play className="mr-2 h-4 w-4" />
              启动所有监控
            </Button>
          )}
        </div>
      </div>

      {strategies.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>没有可用的策略</AlertTitle>
          <AlertDescription>您需要先创建套利策略才能开始监控。</AlertDescription>
        </Alert>
      ) : (
        <>
          {/* 添加统计信息面板 */}
          <DashboardStats opportunities={opportunities} />

          <Card>
            <CardHeader>
              <CardTitle>监控状态</CardTitle>
              <CardDescription>当前正在监控 {activeStrategies.length} 个策略</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-sm">更新间隔:</div>
                    <Select value={updateInterval.toString()} onValueChange={handleIntervalChange}>
                      <SelectTrigger className="w-24">
                        <SelectValue placeholder="更新间隔" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 秒</SelectItem>
                        <SelectItem value="5">5 秒</SelectItem>
                        <SelectItem value="10">10 秒</SelectItem>
                        <SelectItem value="30">30 秒</SelectItem>
                        <SelectItem value="60">60 秒</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Badge variant={loading ? "outline" : "default"}>
                    {loading ? "正在更新..." : `${nextUpdate} 秒后更新`}
                  </Badge>
                </div>
                <Progress value={(updateInterval - nextUpdate) * (100 / updateInterval)} />
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="opportunities">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="opportunities">套利机会</TabsTrigger>
              <TabsTrigger value="strategies">策略管理</TabsTrigger>
            </TabsList>

            <TabsContent value="opportunities">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>套利机会</CardTitle>
                    <CardDescription>实时监控的套利机会和价格差异</CardDescription>
                  </div>
                  <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="选择策略" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">所有策略</SelectItem>
                      {activeStrategies.map((strategy) => (
                        <SelectItem key={strategy.id} value={strategy.id}>
                          {strategy.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardHeader>
                <CardContent>
                  {filteredOpportunities.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">正在等待价格数据...</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>策略</TableHead>
                          <TableHead>源链/目标链</TableHead>
                          <TableHead>源价格</TableHead>
                          <TableHead>目标价格</TableHead>
                          <TableHead>利润 (%)</TableHead>
                          <TableHead>更新时间</TableHead>
                          <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOpportunities.map((opportunity, index) => (
                          <TableRow key={`${opportunity.strategyId}-${index}`}>
                            <TableCell className="font-medium">{opportunity.strategyName}</TableCell>
                            <TableCell>
                              {opportunity.sourceChain} → {opportunity.targetChain}
                            </TableCell>
                            
                            <TableCell>{opportunity.sourceOutputAmount}</TableCell>
                            <TableCell>{opportunity.finalOutputAmount}</TableCell>
                            <TableCell className={getProfitColor(opportunity.profitPercentage)}>
                              {opportunity.profitPercentage.toFixed(2)}%
                              {opportunity.profitPercentage > 1.0 && (
                                <Badge variant="outline" className="ml-2 bg-green-100 text-green-800">
                                  套利机会
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>{formatTime(opportunity.timestamp)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => openPriceHistory(opportunity.strategyId, opportunity.strategyName)}
                                  title="查看价格历史"
                                >
                                  <History className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => openRouteDetails(opportunity)}
                                  title="查看交易路径"
                                >
                                  <Route className="h-4 w-4" />
                                </Button>
                                {opportunity.profitPercentage > 0 && (
                                  <Button
                                    variant={opportunity.profitPercentage > 1.0 ? "default" : "outline"}
                                    className={
                                      opportunity.profitPercentage > 1.0 ? "bg-blue-600 hover:bg-blue-700" : ""
                                    }
                                    size="icon"
                                    onClick={() => openTradeExecution(opportunity)}
                                    title="执行交易"
                                  >
                                    <Zap className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="strategies">
              <Card>
                <CardHeader>
                  <CardTitle>策略管理</CardTitle>
                  <CardDescription>管理和控制套利策略</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>策略名称</TableHead>
                        <TableHead>源链/代币</TableHead>
                        <TableHead>目标链/代币</TableHead>
                        <TableHead>初始金额</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>自动交易</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {strategies.map((strategy) => (
                        <TableRow key={strategy.id}>
                          <TableCell className="font-medium">{strategy.name}</TableCell>
                          <TableCell>
                            {strategy.sourceChain}/{strategy.sourceToken}
                          </TableCell>
                          <TableCell>
                            {strategy.targetChain}/{strategy.targetToken}
                          </TableCell>
                          <TableCell>{strategy.initialAmount}</TableCell>
                          <TableCell>
                            <Badge
                              variant={strategy.isActive ? "default" : "outline"}
                              className={strategy.isActive ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}
                            >
                              {strategy.isActive ? "监控中" : "已停止"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={strategy.autoTrade ? "secondary" : "outline"}
                              className={strategy.autoTrade ? "bg-blue-100 text-blue-800 hover:bg-blue-200" : ""}
                            >
                              {strategy.autoTrade ? `自动 (${strategy.minProfitPercentage}%)` : "手动"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant={strategy.isActive ? "destructive" : "default"}
                                className={!strategy.isActive ? "bg-blue-600 hover:bg-blue-700" : ""}
                                size="sm"
                                onClick={() => toggleStrategy(strategy.id, strategy.isActive)}
                              >
                                {strategy.isActive ? (
                                  <>
                                    <Square className="mr-2 h-4 w-4" />
                                    停止
                                  </>
                                ) : (
                                  <>
                                    <Play className="mr-2 h-4 w-4" />
                                    启动
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => openAutoTradeSettings(strategy)}
                                title="自动交易设置"
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => openTradeExecutions(strategy.id, strategy.name)}
                                title="交易记录"
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* 对话框组件 */}
      <PriceHistoryDialog
        open={priceHistoryDialog.open}
        onOpenChange={(open) => setPriceHistoryDialog({ ...priceHistoryDialog, open })}
        strategyId={priceHistoryDialog.strategyId}
        strategyName={priceHistoryDialog.strategyName}
      />

      <RouteDetailsDialog
        open={routeDetailsDialog.open}
        onOpenChange={(open) => setRouteDetailsDialog({ ...routeDetailsDialog, open })}
        sourceChain={routeDetailsDialog.sourceChain}
        targetChain={routeDetailsDialog.targetChain}
        sourceRoute={routeDetailsDialog.sourceRoute}
        targetRoute={routeDetailsDialog.targetRoute}
      />

      {tradeExecutionDialog.strategy && (
        <TradeExecutionDialog
          open={tradeExecutionDialog.open}
          onOpenChange={(open) => setTradeExecutionDialog({ ...tradeExecutionDialog, open })}
          strategy={tradeExecutionDialog.strategy}
          sourcePrice={tradeExecutionDialog.sourcePrice}
          targetPrice={tradeExecutionDialog.targetPrice}
          profitPercentage={tradeExecutionDialog.profitPercentage}
        />
      )}

      {autoTradeDialog.strategy && (
        <AutoTradeDialog
          open={autoTradeDialog.open}
          onOpenChange={(open) => setAutoTradeDialog({ ...autoTradeDialog, open })}
          strategy={autoTradeDialog.strategy}
          onUpdate={() => {
            // 重新加载策略
            const allStrategies = getStrategies()
            setStrategies(allStrategies)
            setActiveStrategies(allStrategies.filter((s) => s.isActive))
          }}
        />
      )}

      <TradeExecutionsDialog
        open={tradeExecutionsDialog.open}
        onOpenChange={(open) => setTradeExecutionsDialog({ ...tradeExecutionsDialog, open })}
        strategyId={tradeExecutionsDialog.strategyId}
        strategyName={tradeExecutionsDialog.strategyName}
      />
    </div>
  )
}
