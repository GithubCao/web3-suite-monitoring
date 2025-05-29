"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { getApiMonitorRecordsById, getApiStatsById, getApiHealthStatus, clearApiMonitorData } from "@/lib/api-monitor"
import type { ApiConfig, ApiMonitorRecord, ApiStats } from "@/lib/types"
import { CheckCircle, XCircle, AlertTriangle, TrendingUp, TrendingDown, RefreshCw, Trash2 } from "lucide-react"

interface ApiMonitorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  apiConfig: ApiConfig
}

export function ApiMonitorDialog({ open, onOpenChange, apiConfig }: ApiMonitorDialogProps) {
  const [monitorRecords, setMonitorRecords] = useState<ApiMonitorRecord[]>([])
  const [apiStats, setApiStats] = useState<ApiStats | null>(null)
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d">("24h")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // 加载监控数据
  const loadMonitorData = () => {
    setLoading(true)

    // 根据时间范围过滤记录
    const now = Date.now()
    const timeRangeMs = {
      "1h": 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
    }[timeRange]

    const allRecords = getApiMonitorRecordsById(apiConfig.id, 1000)
    const filteredRecords = allRecords.filter((record) => record.timestamp > now - timeRangeMs)

    setMonitorRecords(filteredRecords)
    setApiStats(getApiStatsById(apiConfig.id))
    setLoading(false)
  }

  useEffect(() => {
    if (open) {
      loadMonitorData()
    }
  }, [open, timeRange, apiConfig.id])

  // 清除监控数据
  const handleClearData = () => {
    clearApiMonitorData()
    setMonitorRecords([])
    setApiStats(null)
    toast({
      title: "监控数据已清除",
      description: "所有API监控数据已被清除",
    })
  }

  // 获取健康状态
  const healthStatus = getApiHealthStatus(apiConfig.id)

  // 获取健康状态颜色和图标
  const getHealthStatusDisplay = (status: "healthy" | "warning" | "error") => {
    switch (status) {
      case "healthy":
        return {
          icon: <CheckCircle className="h-4 w-4 text-green-500" />,
          color: "text-green-600",
          bg: "bg-green-100",
          label: "健康",
        }
      case "warning":
        return {
          icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
          color: "text-yellow-600",
          bg: "bg-yellow-100",
          label: "警告",
        }
      case "error":
        return {
          icon: <XCircle className="h-4 w-4 text-red-500" />,
          color: "text-red-600",
          bg: "bg-red-100",
          label: "错误",
        }
    }
  }

  const healthDisplay = getHealthStatusDisplay(healthStatus)

  // 格式化时间
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  // 获取响应时间颜色
  const getResponseTimeColor = (responseTime: number) => {
    if (responseTime < 1000) return "text-green-600"
    if (responseTime < 3000) return "text-yellow-600"
    return "text-red-600"
  }

  // 计算时间范围内的统计
  const calculateRangeStats = () => {
    if (monitorRecords.length === 0) return null

    const successCount = monitorRecords.filter((r) => r.status === "success").length
    const errorCount = monitorRecords.filter((r) => r.status === "error").length
    const timeoutCount = monitorRecords.filter((r) => r.status === "timeout").length
    const avgResponseTime = monitorRecords.reduce((sum, r) => sum + r.responseTime, 0) / monitorRecords.length
    const successRate = (successCount / monitorRecords.length) * 100

    return {
      total: monitorRecords.length,
      success: successCount,
      error: errorCount,
      timeout: timeoutCount,
      successRate,
      avgResponseTime,
    }
  }

  const rangeStats = calculateRangeStats()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>API监控 - {apiConfig.name}</span>
            {healthDisplay.icon}
            <Badge className={`${healthDisplay.bg} ${healthDisplay.color}`}>{healthDisplay.label}</Badge>
          </DialogTitle>
          <DialogDescription>查看API的性能指标、响应时间和错误统计</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 控制面板 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Label>时间范围:</Label>
              <Select value={timeRange} onValueChange={(value: "1h" | "24h" | "7d") => setTimeRange(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">最近1小时</SelectItem>
                  <SelectItem value="24h">最近24小时</SelectItem>
                  <SelectItem value="7d">最近7天</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={loadMonitorData} disabled={loading}>
                <RefreshCw className="mr-2 h-4 w-4" />
                刷新
              </Button>
              <Button variant="destructive" size="sm" onClick={handleClearData}>
                <Trash2 className="mr-2 h-4 w-4" />
                清除数据
              </Button>
            </div>
          </div>

          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">概览</TabsTrigger>
              <TabsTrigger value="records">请求记录</TabsTrigger>
              <TabsTrigger value="stats">统计信息</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* 概览统计卡片 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">总请求数</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{rangeStats?.total || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {timeRange === "1h" ? "最近1小时" : timeRange === "24h" ? "最近24小时" : "最近7天"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">成功率</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {rangeStats ? `${rangeStats.successRate.toFixed(1)}%` : "0%"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {rangeStats?.success || 0} / {rangeStats?.total || 0} 成功
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">平均响应时间</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-2xl font-bold ${rangeStats ? getResponseTimeColor(rangeStats.avgResponseTime) : ""}`}
                    >
                      {rangeStats ? `${rangeStats.avgResponseTime.toFixed(0)}ms` : "0ms"}
                    </div>
                    <p className="text-xs text-muted-foreground">响应时间</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">错误数</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {(rangeStats?.error || 0) + (rangeStats?.timeout || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {rangeStats?.error || 0} 错误, {rangeStats?.timeout || 0} 超时
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* 健康状态 */}
              <Card>
                <CardHeader>
                  <CardTitle>API健康状态</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-full ${healthDisplay.bg}`}>{healthDisplay.icon}</div>
                    <div>
                      <div className={`text-lg font-semibold ${healthDisplay.color}`}>{healthDisplay.label}</div>
                      <p className="text-sm text-muted-foreground">基于最近24小时的成功率和响应时间评估</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="records" className="space-y-4">
              {/* 请求记录表格 */}
              <Card>
                <CardHeader>
                  <CardTitle>最近请求记录</CardTitle>
                  <CardDescription>显示最近 {monitorRecords.length} 条API请求记录</CardDescription>
                </CardHeader>
                <CardContent>
                  {monitorRecords.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">暂无请求记录</div>
                  ) : (
                    <div className="max-h-96 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>时间</TableHead>
                            <TableHead>状态</TableHead>
                            <TableHead>响应时间</TableHead>
                            <TableHead>链ID</TableHead>
                            <TableHead>错误信息</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {monitorRecords.map((record) => (
                            <TableRow key={record.id}>
                              <TableCell className="text-xs">{formatTime(record.timestamp)}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    record.status === "success"
                                      ? "default"
                                      : record.status === "timeout"
                                        ? "secondary"
                                        : "destructive"
                                  }
                                >
                                  {record.status === "success" ? "成功" : record.status === "timeout" ? "超时" : "错误"}
                                </Badge>
                              </TableCell>
                              <TableCell className={getResponseTimeColor(record.responseTime)}>
                                {record.responseTime}ms
                              </TableCell>
                              <TableCell>{record.chainId || "-"}</TableCell>
                              <TableCell className="max-w-40 truncate text-xs" title={record.error}>
                                {record.error || "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stats" className="space-y-4">
              {/* 全局统计信息 */}
              {apiStats ? (
                <div className="grid gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>全局统计</CardTitle>
                      <CardDescription>API的历史统计数据</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>总请求数</Label>
                          <div className="text-2xl font-bold">{apiStats.totalRequests}</div>
                        </div>
                        <div>
                          <Label>总体成功率</Label>
                          <div className="text-2xl font-bold text-green-600">{apiStats.successRate.toFixed(1)}%</div>
                        </div>
                        <div>
                          <Label>平均响应时间</Label>
                          <div className={`text-2xl font-bold ${getResponseTimeColor(apiStats.averageResponseTime)}`}>
                            {apiStats.averageResponseTime.toFixed(0)}ms
                          </div>
                        </div>
                        <div>
                          <Label>最后请求时间</Label>
                          <div className="text-sm">
                            {apiStats.lastRequest ? formatTime(apiStats.lastRequest) : "无"}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div>
                          <Label>24小时请求数</Label>
                          <div className="text-xl font-semibold">{apiStats.last24hRequests}</div>
                        </div>
                        <div>
                          <Label>24小时成功率</Label>
                          <div className="text-xl font-semibold text-green-600">
                            {apiStats.last24hSuccessRate.toFixed(1)}%
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div>
                          <Label>成功请求数</Label>
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            <span className="text-lg font-semibold text-green-600">{apiStats.successRequests}</span>
                          </div>
                        </div>
                        <div>
                          <Label>失败请求数</Label>
                          <div className="flex items-center space-x-2">
                            <TrendingDown className="h-4 w-4 text-red-500" />
                            <span className="text-lg font-semibold text-red-600">{apiStats.errorRequests}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="py-6">
                    <div className="text-center text-muted-foreground">暂无统计数据</div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
