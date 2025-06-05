"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import type { Strategy } from "@/lib/types"
import { addStrategy } from "@/lib/storage"
import { getChainNames, getCommonTokens } from "@/lib/config"
import { getApiProviderOptions } from "@/lib/api-config"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Zap, Globe, Key } from "lucide-react"

export default function NewStrategyPage() {
  const router = useRouter()
  const { toast } = useToast()
  const chainNames = getChainNames()
  const apiProviderOptions = getApiProviderOptions()

  // 添加配置刷新状态
  const [configRefreshKey, setConfigRefreshKey] = useState(0)

  // 在组件挂载时刷新配置
  useEffect(() => {
    const { forceRefreshConfig } = require("@/lib/config")
    forceRefreshConfig()
  }, [])

  const [formData, setFormData] = useState<Partial<Strategy>>({
    name: "",
    sourceChain: "",
    sourceToken: "",
    targetChain: "",
    targetToken: "",
    initialAmount: "1",
    gasFee: "0.01",
    networkFee: "0.005",
    slippage: "0.005",
    maxGasPrice: "50",
    gasLimit: "300000",
    bridgeFee: "0.003",
    dexFee: "0.003",
    minProfitPercentage: "1.0",
    isActive: false,
    autoTrade: false,
    preferredApiProvider: "",
    fallbackApiProviders: [],
  })

  const [sourceTokens, setSourceTokens] = useState<string[]>([])
  const [targetTokens, setTargetTokens] = useState<string[]>([])
  const [useCommonTokens, setUseCommonTokens] = useState(true)
  const [commonTokens, setCommonTokens] = useState<string[]>([])

  useEffect(() => {
    if (formData.sourceChain && formData.targetChain) {
      const common = getCommonTokens(formData.sourceChain, formData.targetChain)
      setCommonTokens(common)
    }
  }, [formData.sourceChain, formData.targetChain])

  // 修改 handleSourceChainChange 函数，确保获取最新的代币列表
  const handleSourceChainChange = (value: string) => {
    // 强制刷新配置以获取最新代币
    const { forceRefreshConfig, getTokensForChain: getLatestTokens } = require("@/lib/config")
    forceRefreshConfig()

    const tokens = getLatestTokens(value)
    setSourceTokens(tokens)

    let newSourceToken = ""
    if (tokens.length > 0) {
      newSourceToken = tokens[0]
    }

    const newFormData = {
      ...formData,
      sourceChain: value,
      sourceToken: newSourceToken,
    }

    setFormData(newFormData)

    if (formData.targetChain) {
      const common = getCommonTokens(value, formData.targetChain)
      setCommonTokens(common)

      if (useCommonTokens && common.length > 0) {
        setFormData({
          ...newFormData,
          sourceToken: common[0],
          targetToken: common[0],
        })
      }
    }

    console.log(`源链 ${value} 可用代币数量: ${tokens.length}`)
  }

  // 修改 handleTargetChainChange 函数
  const handleTargetChainChange = (value: string) => {
    // 强制刷新配置以获取最新代币
    const { forceRefreshConfig, getTokensForChain: getLatestTokens } = require("@/lib/config")
    forceRefreshConfig()

    const tokens = getLatestTokens(value)
    setTargetTokens(tokens)

    let newTargetToken = ""
    if (tokens.length > 0) {
      newTargetToken = tokens[0]
    }

    const newFormData = {
      ...formData,
      targetChain: value,
      targetToken: newTargetToken,
    }

    setFormData(newFormData)

    if (formData.sourceChain) {
      const common = getCommonTokens(formData.sourceChain, value)
      setCommonTokens(common)

      if (useCommonTokens && common.length > 0) {
        setFormData({
          ...newFormData,
          sourceToken: common[0],
          targetToken: common[0],
        })
      }
    }

    console.log(`目标链 ${value} 可用代币数量: ${tokens.length}`)
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

    if (useCommonTokens && (name === "sourceToken" || name === "targetToken")) {
      if (commonTokens.includes(value)) {
        setFormData({
          ...formData,
          sourceToken: value,
          targetToken: value,
          [name]: value,
        })
      }
    }
  }

  const handleCommonTokensChange = (checked: boolean) => {
    setUseCommonTokens(checked)

    if (checked && commonTokens.length > 0) {
      setFormData({
        ...formData,
        sourceToken: commonTokens[0],
        targetToken: commonTokens[0],
      })
    }
  }

  const handleFallbackProvidersChange = (providers: string[]) => {
    setFormData({
      ...formData,
      fallbackApiProviders: providers,
    })
  }

  const getApiProviderIcon = (provider: string) => {
    if (provider.includes("1inch")) return <Zap className="h-4 w-4" />
    if (provider.includes("paraswap") || provider.includes("0x")) return <Key className="h-4 w-4" />
    return <Globe className="h-4 w-4" />
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !formData.name ||
      !formData.sourceChain ||
      !formData.sourceToken ||
      !formData.targetChain ||
      !formData.targetToken ||
      !formData.initialAmount
    ) {
      toast({
        title: "表单不完整",
        description: "请填写所有必填字段",
        variant: "destructive",
      })
      return
    }

    const newStrategy: Strategy = {
      id: crypto.randomUUID(),
      name: formData.name!,
      sourceChain: formData.sourceChain!,
      sourceToken: formData.sourceToken!,
      targetChain: formData.targetChain!,
      targetToken: formData.targetToken!,
      initialAmount: formData.initialAmount!,
      gasFee: formData.gasFee || "0.01",
      networkFee: formData.networkFee || "0.005",
      slippage: formData.slippage || "0.005",
      maxGasPrice: formData.maxGasPrice || "50",
      gasLimit: formData.gasLimit || "300000",
      bridgeFee: formData.bridgeFee || "0.003",
      dexFee: formData.dexFee || "0.003",
      minProfitPercentage: formData.minProfitPercentage || "1.0",
      autoTrade: formData.autoTrade || false,
      preferredApiProvider: formData.preferredApiProvider || undefined,
      fallbackApiProviders:
        formData.fallbackApiProviders && formData.fallbackApiProviders.length > 0
          ? formData.fallbackApiProviders
          : undefined,
      isActive: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    addStrategy(newStrategy)

    toast({
      title: "策略已创建",
      description: "套利策略已成功创建",
    })

    router.push("/strategies")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">创建新策略</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>套利策略配置</CardTitle>
            <CardDescription>创建一个新的跨链套利监控策略</CardDescription>
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

            <div className="flex items-center space-x-2">
              <Checkbox id="useCommonTokens" checked={useCommonTokens} onCheckedChange={handleCommonTokensChange} />
              <label
                htmlFor="useCommonTokens"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                使用相同代币进行跨链套利 (推荐)
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>源链</Label>
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
                      {useCommonTokens
                        ? commonTokens.map((token) => (
                            <SelectItem key={token} value={token}>
                              {token}
                            </SelectItem>
                          ))
                        : sourceTokens.map((token) => (
                            <SelectItem key={token} value={token}>
                              {token}
                            </SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>目标链</Label>
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
                    disabled={!formData.targetChain || useCommonTokens}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择目标代币" />
                    </SelectTrigger>
                    <SelectContent>
                      {useCommonTokens
                        ? commonTokens.map((token) => (
                            <SelectItem key={token} value={token}>
                              {token}
                            </SelectItem>
                          ))
                        : targetTokens.map((token) => (
                            <SelectItem key={token} value={token}>
                              {token}
                            </SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Tabs defaultValue="basic">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">基本设置</TabsTrigger>
                <TabsTrigger value="api">API设置</TabsTrigger>
                <TabsTrigger value="advanced">高级设置</TabsTrigger>
              </TabsList>

              <TabsContent value="basic">
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="api">
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>首选API提供商</Label>
                    <Select
                      value={formData.preferredApiProvider || ""}
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
                            checked={formData.fallbackApiProviders?.includes(option.value) || false}
                            onCheckedChange={(checked) => {
                              const currentProviders = formData.fallbackApiProviders || []
                              if (checked) {
                                handleFallbackProvidersChange([...currentProviders, option.value])
                              } else {
                                handleFallbackProvidersChange(currentProviders.filter((id) => id !== option.value))
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
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="advanced">
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <p className="text-xs text-muted-foreground">每笔交易的预估Gas费用</p>
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
                      <p className="text-xs text-muted-foreground">网络交易费用</p>
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
                      <p className="text-xs text-muted-foreground">去中心化交易所费用</p>
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

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="autoTrade"
                          checked={formData.autoTrade}
                          onCheckedChange={(checked) => setFormData({ ...formData, autoTrade: checked as boolean })}
                        />
                        <label
                          htmlFor="autoTrade"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          启用自动交易
                        </label>
                      </div>
                      <p className="text-xs text-muted-foreground">当利润超过阈值时自动执行交易</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => router.push("/strategies")}>
              取消
            </Button>
            <Button type="submit">创建策略</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
