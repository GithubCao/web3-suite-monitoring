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
import { getStrategyById, updateStrategy } from "@/lib/storage"
import { getChainNames, getTokensForChain } from "@/lib/config"
import { Checkbox } from "@/components/ui/checkbox"

export default function EditStrategyPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const chainNames = getChainNames()
  const { id } = params

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
    isActive: false,
  })

  const [sourceTokens, setSourceTokens] = useState<string[]>([])
  const [targetTokens, setTargetTokens] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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

    // 设置目标链代币
    const targetTokensList = getTokensForChain(strategy.targetChain)
    setTargetTokens(targetTokensList)

    // 设置表单数据
    setFormData(strategy)
    setLoading(false)
  }, [id, router, toast])

  const handleSourceChainChange = (value: string) => {
    const tokens = getTokensForChain(value)
    setSourceTokens(tokens)
    setFormData({
      ...formData,
      sourceChain: value,
      sourceToken: tokens.length > 0 ? tokens[0] : "",
    })
  }

  const handleTargetChainChange = (value: string) => {
    const tokens = getTokensForChain(value)
    setTargetTokens(tokens)
    setFormData({
      ...formData,
      targetChain: value,
      targetToken: tokens.length > 0 ? tokens[0] : "",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // 验证表单
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

  if (loading) {
    return <div className="flex items-center justify-center h-full">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">编辑策略</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>套利策略配置</CardTitle>
            <CardDescription>编辑现有的跨链套利监控策略</CardDescription>
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
                      {sourceTokens.map((token) => (
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
              </div>
            </div>

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="gasFee">Gas 费用</Label>
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
              </div>
            </div>

            <div className="space-y-4 mt-6">
              <h3 className="text-lg font-medium">高级设置</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="maxGasPrice">最大 Gas 价格 (Gwei)</Label>
                  <Input
                    id="maxGasPrice"
                    name="maxGasPrice"
                    type="number"
                    step="1"
                    min="0"
                    placeholder="输入最大Gas价格"
                    value={formData.maxGasPrice || "50"}
                    onChange={handleInputChange}
                  />
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
                    value={formData.gasLimit || "300000"}
                    onChange={handleInputChange}
                  />
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
                    value={formData.bridgeFee || "0.003"}
                    onChange={handleInputChange}
                  />
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
                    value={formData.dexFee || "0.003"}
                    onChange={handleInputChange}
                  />
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
                    value={formData.minProfitPercentage || "1.0"}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
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
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => router.push("/strategies")}>
              取消
            </Button>
            <Button type="submit">保存更改</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
