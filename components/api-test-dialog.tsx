"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { testApiConnection } from "@/lib/api-config"
import { ChainIdMap } from "@/lib/config"
import type { ApiConfig } from "@/lib/types"
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react"

interface ApiTestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  apiConfig: ApiConfig
}

interface TestResult {
  chainId: number
  chainName: string
  success: boolean
  responseTime: number
  error?: string
}

export function ApiTestDialog({ open, onOpenChange, apiConfig }: ApiTestDialogProps) {
  const [testing, setTesting] = useState(false)
  const [selectedChainId, setSelectedChainId] = useState<number | null>(null)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [progress, setProgress] = useState(0)
  const { toast } = useToast()

  // 获取支持的链
  const supportedChains = Object.entries(ChainIdMap).filter(([_, chainId]) =>
    apiConfig.supportedChains.includes(chainId),
  )

  // 测试单个链
  const testSingleChain = async (chainId: number) => {
    const chainName = Object.keys(ChainIdMap).find((key) => ChainIdMap[key] === chainId) || `Chain ${chainId}`

    try {
      const result = await testApiConnection(apiConfig, chainId)
      return {
        chainId,
        chainName,
        success: result.success,
        responseTime: result.responseTime,
        error: result.error,
      }
    } catch (error) {
      return {
        chainId,
        chainName,
        success: false,
        responseTime: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  // 测试所有支持的链
  const testAllChains = async () => {
    setTesting(true)
    setTestResults([])
    setProgress(0)

    const results: TestResult[] = []
    const totalChains = supportedChains.length

    for (let i = 0; i < supportedChains.length; i++) {
      const [_, chainId] = supportedChains[i]
      const result = await testSingleChain(chainId)
      results.push(result)
      setTestResults([...results])
      setProgress(((i + 1) / totalChains) * 100)
    }

    setTesting(false)

    // 显示测试结果摘要
    const successCount = results.filter((r) => r.success).length
    const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length

    toast({
      title: "API测试完成",
      description: `${successCount}/${totalChains} 个链测试成功，平均响应时间 ${avgResponseTime.toFixed(0)}ms`,
      variant: successCount === totalChains ? "default" : "destructive",
    })
  }

  // 测试选定的链
  const testSelectedChain = async () => {
    if (!selectedChainId) return

    setTesting(true)
    setTestResults([])
    setProgress(0)

    const result = await testSingleChain(selectedChainId)
    setTestResults([result])
    setProgress(100)
    setTesting(false)

    toast({
      title: result.success ? "测试成功" : "测试失败",
      description: result.success ? `响应时间: ${result.responseTime}ms` : result.error || "未知错误",
      variant: result.success ? "default" : "destructive",
    })
  }

  // 获取状态图标
  const getStatusIcon = (result: TestResult) => {
    if (result.success) {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    } else {
      return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  // 获取响应时间颜色
  const getResponseTimeColor = (responseTime: number) => {
    if (responseTime < 1000) return "text-green-600"
    if (responseTime < 3000) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>API连接测试</DialogTitle>
          <DialogDescription>测试 {apiConfig.name} 的连接状态和响应时间</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* API信息 */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">API名称:</span> {apiConfig.name}
            </div>
            <div>
              <span className="font-medium">提供商:</span> {apiConfig.provider}
            </div>
            <div>
              <span className="font-medium">基础URL:</span> {apiConfig.config.baseUrl}
            </div>
            <div>
              <span className="font-medium">超时时间:</span> {apiConfig.config.timeout || 10000}ms
            </div>
          </div>

          {/* 测试选项 */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Button onClick={testAllChains} disabled={testing || supportedChains.length === 0} className="flex-1">
                {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                测试所有支持的链 ({supportedChains.length})
              </Button>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Label>选择特定链测试</Label>
                <Select
                  value={selectedChainId?.toString() || ""}
                  onValueChange={(value) => setSelectedChainId(Number.parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择链" />
                  </SelectTrigger>
                  <SelectContent>
                    {supportedChains.map(([chainName, chainId]) => (
                      <SelectItem key={chainId} value={chainId.toString()}>
                        {chainName} (ID: {chainId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={testSelectedChain} disabled={testing || !selectedChainId} variant="outline">
                {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                测试
              </Button>
            </div>
          </div>

          {/* 进度条 */}
          {testing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>测试进度</span>
                <span>{progress.toFixed(0)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* 测试结果 */}
          {testResults.length > 0 && (
            <div className="space-y-2">
              <Label>测试结果</Label>
              <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(result)}
                      <span className="font-medium">{result.chainName}</span>
                      <Badge variant="outline">ID: {result.chainId}</Badge>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      {result.success ? (
                        <>
                          <Clock className="h-3 w-3" />
                          <span className={getResponseTimeColor(result.responseTime)}>{result.responseTime}ms</span>
                        </>
                      ) : (
                        <span className="text-red-500 text-xs max-w-40 truncate" title={result.error}>
                          {result.error}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
