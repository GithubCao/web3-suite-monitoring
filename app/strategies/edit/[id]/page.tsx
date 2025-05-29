"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import type { Strategy } from "@/lib/types"
import { getStrategyById, updateStrategy } from "@/lib/storage"
import { getChainNames, getTokensForChain } from "@/lib/config"
import { getApiProviderOptions } from "@/lib/api-config"
import { Checkbox } from "@/components/ui/checkbox"
import { Zap, Globe, Key } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function EditStrategyPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const { id } = params

  // 使用 useState 来管理链名称和API提供商选项
  const [chainNames, setChainNames] = useState<string[]>([])
  const [apiProviderOptions, setApiProviderOptions] = useState<{ value: string; label: string; description: string }[]>([])

  const [formData, setFormData] = useState<Partial<Strategy>>({
    name: "",
    sourceChain: "",
    sourceToken: "",
    sourceTargetToken: "",
    targetChain: "",
    targetToken: "",
    targetSourceToken: "",
    initialAmount: "1",
    gasFee: "0.01",
    networkFee: "0.005",
    slippage: "0.005",
    maxGasPrice: "50",
    gasLimit: "300000",
    bridgeFee: "0.003",
    dexFee: "0.003",
    minProfitPercentage: "1.0",
    autoTrade: false,
    preferredApiProvider: "",
    fallbackApiProviders: [],
    isActive: false,
  })

  // 可选代币列表
  const [sourceTokens, setSourceTokens] = useState<string[]>([])
  const [sourceTargetTokens, setSourceTargetTokens] = useState<string[]>([])
  const [targetTokens, setTargetTokens] = useState<string[]>([])
  const [targetSourceTokens, setTargetSourceTokens] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 加载链名称和API提供商选项
    setChainNames(getChainNames())
    setApiProviderOptions(getApiProviderOptions())

    // 加载策略数据
    const strategy = getStrategyById(id)

    if (!strategy) {
      toast({
        title: "策略不存在",
        description: "找不到指定的策略",
        variant: "destructive",
      })
      router.push("/strategies")
      return
    }

    // 设置源链代币
    const sourceTokensList = getTokensForChain(strategy.sourceChain)
    setSourceTokens(sourceTokensList)
    setSourceTargetTokens(sourceTokensList)

    // 设置目标链代币
    const targetTokensList = getTokensForChain(strategy.targetChain)
    setTargetTokens(targetTokensList)
    setTargetSourceTokens(targetTokensList)

    // 设置表单数据
    setFormData({
      ...strategy,
      // 确保数组属性不为 undefined
      fallbackApiProviders: strategy.fallbackApiProviders || [],
    })
    
    setLoading(false)
  }, [id, router, toast])

  const handleSourceChainChange = (value: string) => {
    const tokens = getTokensForChain(value)
    setSourceTokens(tokens)
    setSourceTargetTokens(tokens)

    setFormData({
      ...formData,
      sourceChain: value,
      sourceToken: tokens.length > 0 ? tokens[0] : "",
      sourceTargetToken: tokens.length > 1 ? tokens[1] : tokens[0],
    })
  }

  const handleTargetChainChange = (value: string) => {
    const tokens = getTokensForChain(value)
    setTargetTokens(tokens)
    setTargetSourceTokens(tokens)

    setFormData({
      ...formData,
      targetChain: value,
      targetToken: tokens.length > 0 ? tokens[0] : "",
      targetSourceToken: tokens.length > 1 ? tokens[1] : tokens[0],
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleFallbackProvidersChange = (providers: string[]) => {
    setFormData({
      ...formData,
      fallbackApiProviders: providers,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // 验证表单
    if (
      !formData.name ||
      !formData.sourceChain ||
      !formData.sourceToken ||
      !formData.sourceTargetToken ||
      !formData.targetChain ||
      !formData.targetToken ||
      !formData.targetSourceToken ||
      !formData.initialAmount
    ) {
      toast({
        title: "表单不完整",
        description: "请填写所有必填字段",
        variant: "destructive",
      })
      return
    }

    // 更新策略
    const updatedStrategy: Strategy = {
      ...(formData as Strategy),
      updatedAt: Date.now(),
    }

    // 保存策略
    updateStrategy(updatedStrategy)

    toast({
      title: "策略已更新",
      description: "套利策略已成功更新",
    })

    // 重定向到策略列表
    router.push("/strategies")
  }

  // 获取API提供商图标
  const getApiProviderIcon = (provider: string) => {
    if (provider.includes("1inch")) return <Zap className="h-4 w-4" />
    if (provider.includes("paraswap") || provider.includes("0x")) return <Key className="h-4 w-4" />
    return <Globe className="h-4 w-4" />
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">编辑策略</h1>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">基本配置</TabsTrigger>
          <TabsTrigger value="api">API设置</TabsTrigger>
          <TabsTrigger value="advanced">高级设置</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4 mt-4">
          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>策略基本信息</CardTitle>
                <CardDescription>编辑套利策略的基本参数</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">策略名称</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="输入策略名称"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 源链配置 */}
                  <div className="space-y-4 border p-4 rounded-lg">
                    <h3 className="font-medium text-lg">源链配置</h3>
                    <div className="space-y-2">
                      <Label>选择链</Label>
                      <Select onValueChange={(value) => handleSourceChainChange(value)} value={formData.sourceChain}>
                        <SelectTrigger>
                          <SelectValue placeholder="选择源链" />
                        </SelectTrigger>
                        <SelectContent>
                          {chainNames.map((chain) => (
                            <SelectItem key={chain} value={chain}>
                              {chain}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>源代币</Label>
                      <Select
                        onValueChange={(value) => handleSelectChange("sourceToken", value)}
                        value={formData.sourceToken}
                        disabled={!formData.sourceChain}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择源代币" />
                        </SelectTrigger>
                        <SelectContent>
                          {sourceTokens.map((token) => (
                            <SelectItem key={token} value={token}>
                              {token}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>目标代币</Label>
                      <Select
                        onValueChange={(value) => handleSelectChange("sourceTargetToken", value)}
                        value={formData.sourceTargetToken}
                        disabled={!formData.sourceChain}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择目标代币" />
                        </SelectTrigger>
                        <SelectContent>
                          {sourceTargetTokens.map((token) => (
                            <SelectItem key={token} value={token}>
                              {token}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* 目标链配置 */}
                  <div className="space-y-4 border p-4 rounded-lg">
                    <h3 className="font-medium text-lg">目标链配置</h3>
                    <div className="space-y-2">
                      <Label>选择链</Label>
                      <Select onValueChange={(value) => handleTargetChainChange(value)} value={formData.targetChain}>
                        <SelectTrigger>
                          <SelectValue placeholder="选择目标链" />
                        </SelectTrigger>
                        <SelectContent>
                          {chainNames.map((chain) => (
                            <SelectItem key={chain} value={chain}>
                              {chain}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>目标代币</Label>
                      <Select
                        onValueChange={(value) => handleSelectChange("targetToken", value)}
                        value={formData.targetToken}
                        disabled={!formData.targetChain}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择目标代币" />
                        </SelectTrigger>
                        <SelectContent>
                          {targetTokens.map((token) => (
                            <SelectItem key={token} value={token}>
                              {token}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>源代币</Label>
                      <Select
                        onValueChange={(value) => handleSelectChange("targetSourceToken", value)}
                        value={formData.targetSourceToken}
                        disabled={!formData.targetChain}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择源代币" />
                        </SelectTrigger>
                        <SelectContent>
                          {targetSourceTokens.map((token) => (
                            <SelectItem key={token} value={token}>
                              {token}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="initialAmount">初始金额</Label>
                  <Input
                    id="initialAmount"
                    name="initialAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="输入初始金额"
                    value={formData.initialAmount}
                    onChange={handleInputChange}
                  />
                </div>
              </CardContent>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>API提供商设置</CardTitle>
              <CardDescription>选择价格查询的API提供商和备用选项</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>首选API提供商</Label>
                <Select
                  value={formData.preferredApiProvider}
                  onValueChange={(value) => handleSelectChange("preferredApiProvider", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择首选API提供商" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">自动选择最佳</SelectItem>
                    {apiProviderOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center space-x-2">
                          {getApiProviderIcon(option.value)}
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  优先使用此API提供商获取价格，如果失败则自动切换到备用选项
                </p>
              </div>

              <div className="space-y-2">
                <Label>备用API提供商</Label>
                <div className="space-y-2">
                  {apiProviderOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`fallback-${option.value}`}
                        checked={formData.fallbackApiProviders?.includes(option.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleFallbackProvidersChange([...(formData.fallbackApiProviders || []), option.value])
                          } else {
                            handleFallbackProvidersChange(
                              (formData.fallbackApiProviders || []).filter((id) => id !== option.value),
                            )
                          }
                        }}
                      />
                      <label
                        htmlFor={`fallback-${option.value}`}
                        className="flex items-center space-x-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {getApiProviderIcon(option.value)}
                        <span>{option.label}</span>
                      </label>
                      <Badge variant="outline" className="text-xs">
                        {option.description}
                      </Badge>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">当首选API提供商不可用时，系统将按顺序尝试这些备用选项</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>高级设置</CardTitle>
              <CardDescription>配置套利策略的高级参数</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="slippage">滑点 (%)</Label>
                  <Input
                    id="slippage"
                    name="slippage"
                    type="number"
                    step="0.001"
                    min="0"
                    placeholder="输入滑点百分比"
                    value={formData.slippage}
                    onChange={handleInputChange}
                  />
                  <p className="text-xs text-muted-foreground">交易执行时允许的价格变动百分比</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gasFee">Gas 费用估算</Label>
                  <Input
                    id="gasFee"
                    name="gasFee"
                    type="number"
                    step="0.001"
                    min="0"
                    placeholder="输入 Gas 费用"
                    value={formData.gasFee}
                    onChange={handleInputChange}
                  />
                  <p className="text-xs text-muted-foreground">交易执行时的预估 Gas 费用</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="networkFee">网络费用</Label>
                  <Input
                    id="networkFee"
                    name="networkFee"
                    type="number"
                    step="0.001"
                    min="0"
                    placeholder="输入网络费用"
                    value={formData.networkFee}
                    onChange={handleInputChange}
                  />
                  <p className="text-xs text-muted-foreground">跨链桥接和交易所费用</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxGasPrice">最大 Gas 价格 (Gwei)</Label>
                  <Input
                    id="maxGasPrice"
                    name="maxGasPrice"
                    type="number"
                    step="1"
                    min="0"
                    placeholder="输入最大Gas价格"
                    value={formData.maxGasPrice}
                    onChange={handleInputChange}
                  />
                  <p className="text-xs text-muted-foreground">交易的最大Gas价格限制</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gasLimit">Gas 限制</Label>
                  <Input
                    id="gasLimit"
                    name="gasLimit"
                    type="number"
                    step="1000"
                    min="0"
                    placeholder="输入Gas限制"
                    value={formData.gasLimit}
                    onChange={handleInputChange}
                  />
                  <p className="text-xs text-muted-foreground">交易的Gas限制</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bridgeFee">跨链桥费用 (%)</Label>
                  <Input
                    id="bridgeFee"
                    name="bridgeFee"
                    type="number"
                    step="0.001"
                    min="0"
                    placeholder="输入跨链桥费用"
                    value={formData.bridgeFee}
                    onChange={handleInputChange}
                  />
                  <p className="text-xs text-muted-foreground">跨链桥接费用百分比</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dexFee">DEX 交易费用 (%)</Label>
                  <Input
                    id="dexFee"
                    name="dexFee"
                    type="number"
                    step="0.001"
                    min="0"
                    placeholder="输入DEX费用"
                    value={formData.dexFee}
                    onChange={handleInputChange}
                  />
                  <p className="text-xs text-muted-foreground">DEX交易费用百分比</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minProfitPercentage">最小利润阈值 (%)</Label>
                  <Input
                    id="minProfitPercentage"
                    name="minProfitPercentage"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="输入最小利润阈值"
                    value={formData.minProfitPercentage}
                    onChange={handleInputChange}
                  />
                  <p className="text-xs text-muted-foreground">触发自动交易的最小利润百分比</p>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="autoTrade"
                    checked={formData.autoTrade || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, autoTrade: checked as boolean })}
                  />
                  <label
                    htmlFor="autoTrade"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    启用自动交易
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-4">
        <Button variant="outline" type="button" onClick={() => router.push("/strategies")}>
          取消
        </Button>
        <Button type="button" onClick={handleSubmit}>保存更改</Button>
      </div>
    </div>
  )
}
