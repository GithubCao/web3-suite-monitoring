"use client"

import type React from "react"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import type { Strategy, TokenDetail } from "@/lib/types"
import { getStrategyById, updateStrategy } from "@/lib/storage"
import { getChainNames, getTokensForChain, getCachedTokensForChain } from "@/lib/config"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, Loader2 } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export default function EditStrategyPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const chainNames = getChainNames()
  const { id } = params

  // 在组件挂载时刷新配置
  useEffect(() => {
    const { forceRefreshConfig } = require("@/lib/config")
    forceRefreshConfig()
  }, [])

  const [formData, setFormData] = useState<Partial<Strategy>>({
    name: "",
    description: "",
    sourceChain: "",
    sourceToken: "",
    sourceTargetToken: "",
    targetChain: "",
    targetToken: "",
    targetSourceToken: "",
    amount: "1",
    minProfitPercentage: 1.0,
    enabled: false,
    gasFee: "0.01",
    networkFee: "0.005",
    bridgeFee: "0.003",
    dexFee: "0.003",
    slippage: "0.005",
    maxGasPrice: "50",
    gasLimit: "300000",
    autoTrade: false,
    interval: 60000,
  })

  const [sourceTokens, setSourceTokens] = useState<string[]>([])
  const [sourceTargetTokens, setSourceTargetTokens] = useState<string[]>([])
  const [targetTokens, setTargetTokens] = useState<string[]>([])
  const [targetSourceTokens, setTargetSourceTokens] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const [sourceTokenDetails, setSourceTokenDetails] = useState<TokenDetail[]>([])
  const [targetTokenDetails, setTargetTokenDetails] = useState<TokenDetail[]>([])
  const [sourceTokenSearch, setSourceTokenSearch] = useState("")
  const [sourceTargetTokenSearch, setSourceTargetTokenSearch] = useState("")
  const [targetTokenSearch, setTargetTokenSearch] = useState("")
  const [targetSourceTokenSearch, setTargetSourceTokenSearch] = useState("")
  const [sourceTokenPopoverOpen, setSourceTokenPopoverOpen] = useState(false)
  const [sourceTargetTokenPopoverOpen, setSourceTargetTokenPopoverOpen] = useState(false)
  const [targetTokenPopoverOpen, setTargetTokenPopoverOpen] = useState(false)
  const [targetSourceTokenPopoverOpen, setTargetSourceTokenPopoverOpen] = useState(false)
  const [loadingTokens, setLoadingTokens] = useState(false)

  // 加载链上的代币详情
  const loadTokenDetails = useCallback(
    async (chainName: string, isSourceChain: boolean) => {
      try {
        setLoadingTokens(true)
        const chainId = getChainId(chainName)

        if (!chainId) {
          console.error(`找不到链ID: ${chainName}`)
          return
        }

        // 获取缓存的代币详情
        const tokenDetails = getCachedTokensForChain(chainId)

        if (isSourceChain) {
          setSourceTokenDetails(tokenDetails)
        } else {
          setTargetTokenDetails(tokenDetails)
        }

        // 如果没有缓存的代币详情，则使用基本代币列表
        if (tokenDetails.length === 0) {
          const tokens = getTokensForChain(chainName)
          if (isSourceChain) {
            setSourceTokens(tokens)
            setSourceTargetTokens(tokens)
          } else {
            setTargetTokens(tokens)
            setTargetSourceTokens(tokens)
          }

          // 提示用户没有找到缓存的代币
          toast({
            title: `${chainName}链的代币信息`,
            description: "使用基础代币列表，搜索功能可能受限",
            variant: "default",
          })
        } else {
          // 使用缓存的代币详情构建代币列表
          const tokenSymbols = tokenDetails.map((token) => token.symbol)
          if (isSourceChain) {
            setSourceTokens(tokenSymbols)
            setSourceTargetTokens(tokenSymbols)
          } else {
            setTargetTokens(tokenSymbols)
            setTargetSourceTokens(tokenSymbols)
          }

          // 提示用户加载了多少代币
          toast({
            title: `${chainName}链的代币信息`,
            description: `已加载 ${tokenDetails.length} 个代币，支持搜索`,
            variant: "default",
          })
        }
      } catch (error) {
        console.error(`加载代币详情失败: ${error}`)
        toast({
          title: "加载代币失败",
          description: `无法加载代币详情: ${error instanceof Error ? error.message : "未知错误"}`,
          variant: "destructive",
        })
      } finally {
        setLoadingTokens(false)
      }
    },
    [toast],
  )

  // 获取链ID的辅助函数
  const getChainId = useCallback((chainName: string): number | null => {
    try {
      // 导入的config.ts中应该有getChainId函数
      const { getCurrentConfig } = require("@/lib/config")
      const { chains } = getCurrentConfig()
      return chains[chainName] || null
    } catch (error) {
      console.error(`获取链ID失败: ${error}`)
      return null
    }
  }, [])

  // 懒加载代币详情
  const lazyLoadTokenDetails = useCallback(
    (chainName: string, isSourceChain: boolean) => {
      // 如果已经在加载中，则不重复加载
      if (loadingTokens) return

      // 检查是否已经有足够的代币详情
      const tokenDetails = isSourceChain ? sourceTokenDetails : targetTokenDetails
      if (tokenDetails.length > 0) return

      // 加载代币详情
      loadTokenDetails(chainName, isSourceChain)
    },
    [loadingTokens, sourceTokenDetails, targetTokenDetails, loadTokenDetails],
  )

  // 当打开下拉框时懒加载代币详情
  useEffect(() => {
    if (sourceTokenPopoverOpen && formData.sourceChain) {
      lazyLoadTokenDetails(formData.sourceChain, true)
    }
  }, [sourceTokenPopoverOpen, formData.sourceChain, lazyLoadTokenDetails])

  useEffect(() => {
    if (sourceTargetTokenPopoverOpen && formData.sourceChain) {
      lazyLoadTokenDetails(formData.sourceChain, true)
    }
  }, [sourceTargetTokenPopoverOpen, formData.sourceChain, lazyLoadTokenDetails])

  useEffect(() => {
    if (targetTokenPopoverOpen && formData.targetChain) {
      lazyLoadTokenDetails(formData.targetChain, false)
    }
  }, [targetTokenPopoverOpen, formData.targetChain, lazyLoadTokenDetails])

  useEffect(() => {
    if (targetSourceTokenPopoverOpen && formData.targetChain) {
      lazyLoadTokenDetails(formData.targetChain, false)
    }
  }, [targetSourceTokenPopoverOpen, formData.targetChain, lazyLoadTokenDetails])

  // 当搜索时，确保代币详情已加载
  useEffect(() => {
    if (sourceTokenSearch && formData.sourceChain) {
      lazyLoadTokenDetails(formData.sourceChain, true)
    }
  }, [sourceTokenSearch, formData.sourceChain, lazyLoadTokenDetails])

  useEffect(() => {
    if (sourceTargetTokenSearch && formData.sourceChain) {
      lazyLoadTokenDetails(formData.sourceChain, true)
    }
  }, [sourceTargetTokenSearch, formData.sourceChain, lazyLoadTokenDetails])

  useEffect(() => {
    if (targetTokenSearch && formData.targetChain) {
      lazyLoadTokenDetails(formData.targetChain, false)
    }
  }, [targetTokenSearch, formData.targetChain, lazyLoadTokenDetails])

  useEffect(() => {
    if (targetSourceTokenSearch && formData.targetChain) {
      lazyLoadTokenDetails(formData.targetChain, false)
    }
  }, [targetSourceTokenSearch, formData.targetChain, lazyLoadTokenDetails])

  useEffect(() => {
    // 首先刷新配置
    const { forceRefreshConfig } = require("@/lib/config")
    forceRefreshConfig()

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
    loadTokenDetails(strategy.sourceChain, true)

    // 设置目标链代币
    loadTokenDetails(strategy.targetChain, false)

    // 使用最新的代币列表作为后备
    const sourceTokensList = getTokensForChain(strategy.sourceChain)
    const targetTokensList = getTokensForChain(strategy.targetChain)

    console.log(`策略加载 - 源链 ${strategy.sourceChain} 代币数量: ${sourceTokensList.length}`)
    console.log(`策略加载 - 目标链 ${strategy.targetChain} 代币数量: ${targetTokensList.length}`)

    // 确保策略中包含sourceTargetToken和targetSourceToken
    const updatedStrategy = {
      ...strategy,
      sourceTargetToken:
        strategy.sourceTargetToken || (sourceTokensList.length > 1 ? sourceTokensList[1] : sourceTokensList[0]),
      targetSourceToken:
        strategy.targetSourceToken || (targetTokensList.length > 1 ? targetTokensList[1] : targetTokensList[0]),
    }

    // 设置表单数据
    setFormData(updatedStrategy)
    setLoading(false)
  }, [id, router, toast, loadTokenDetails])

  const handleSourceChainChange = (value: string) => {
    // 强制刷新配置以获取最新代币
    const { forceRefreshConfig, getTokensForChain: getLatestTokens } = require("@/lib/config")
    forceRefreshConfig()

    // 加载代币详情
    loadTokenDetails(value, true)

    // 保持原有逻辑，确保向后兼容
    const tokens = getLatestTokens(value)
    setSourceTokens(tokens)
    setSourceTargetTokens(tokens)
    setFormData({
      ...formData,
      sourceChain: value,
      sourceToken: tokens.length > 0 ? tokens[0] : "",
      sourceTargetToken: tokens.length > 1 ? tokens[1] : tokens[0],
    })

    console.log(`源链 ${value} 可用代币数量: ${tokens.length}`)
  }

  const handleTargetChainChange = (value: string) => {
    // 强制刷新配置以获取最新代币
    const { forceRefreshConfig, getTokensForChain: getLatestTokens } = require("@/lib/config")
    forceRefreshConfig()

    // 加载代币详情
    loadTokenDetails(value, false)

    // 保持原有逻辑，确保向后兼容
    const tokens = getLatestTokens(value)
    setTargetTokens(tokens)
    setTargetSourceTokens(tokens)
    setFormData({
      ...formData,
      targetChain: value,
      targetToken: tokens.length > 0 ? tokens[0] : "",
      targetSourceToken: tokens.length > 1 ? tokens[1] : tokens[0],
    })

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
  }

  // 代币搜索过滤函数
  const filterTokens = useCallback((tokens: TokenDetail[], search: string): TokenDetail[] => {
    if (!search.trim()) return tokens

    const searchLower = search.toLowerCase().trim()
    return tokens.filter(
      (token) =>
        token.symbol.toLowerCase().includes(searchLower) ||
        token.address.toLowerCase().includes(searchLower) ||
        (token.name && token.name.toLowerCase().includes(searchLower)),
    )
  }, [])

  // 过滤后的代币列表
  const filteredSourceTokens = useMemo(() => {
    return sourceTokenDetails.length > 0
      ? filterTokens(sourceTokenDetails, sourceTokenSearch)
      : sourceTokens.map((symbol) => ({ symbol, address: "", chainId: 0, name: symbol, decimals: 18 }))
  }, [sourceTokenDetails, sourceTokens, sourceTokenSearch, filterTokens])

  const filteredSourceTargetTokens = useMemo(() => {
    return sourceTokenDetails.length > 0
      ? filterTokens(sourceTokenDetails, sourceTargetTokenSearch)
      : sourceTargetTokens.map((symbol) => ({ symbol, address: "", chainId: 0, name: symbol, decimals: 18 }))
  }, [sourceTokenDetails, sourceTargetTokens, sourceTargetTokenSearch, filterTokens])

  const filteredTargetTokens = useMemo(() => {
    return targetTokenDetails.length > 0
      ? filterTokens(targetTokenDetails, targetTokenSearch)
      : targetTokens.map((symbol) => ({ symbol, address: "", chainId: 0, name: symbol, decimals: 18 }))
  }, [targetTokenDetails, targetTokens, targetTokenSearch, filterTokens])

  const filteredTargetSourceTokens = useMemo(() => {
    return targetTokenDetails.length > 0
      ? filterTokens(targetTokenDetails, targetSourceTokenSearch)
      : targetSourceTokens.map((symbol) => ({ symbol, address: "", chainId: 0, name: symbol, decimals: 18 }))
  }, [targetTokenDetails, targetSourceTokens, targetSourceTokenSearch, filterTokens])

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
      !formData.amount
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
      enabled: formData.enabled ?? false,
      minProfitPercentage: Number.parseFloat(String(formData.minProfitPercentage)) || 1.0,
      interval: formData.interval || 60000,
      sourceTargetToken: formData.sourceTargetToken,
      targetSourceToken: formData.targetSourceToken,
      amount: formData.amount, // 确保明确设置amount字段
    }

    console.log("保存策略，初始金额:", formData.amount)
    console.log("更新策略对象:", updatedStrategy)

    // 保存策略
    updateStrategy(updatedStrategy)

    toast({
      title: "策略已更新",
      description: "套利策略已成功更新",
    })

    // 重定向到策略列表
    router.push("/strategies")
  }

  // 添加一个代币加载状态指示器组件
  const TokenLoadingIndicator = () => {
    if (!loadingTokens) return null

    return (
      <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-md flex items-center space-x-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>加载代币中...</span>
      </div>
    )
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
              <div className="space-y-4 border p-4 rounded-lg">
                <h3 className="font-medium text-lg">源链配置</h3>
                <div className="space-y-2">
                  <Label>选择链</Label>
                  <Select onValueChange={(value) => handleSourceChainChange(value)} value={formData.sourceChain}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择源链" />
                    </SelectTrigger>
                    <SelectContent>
                      {chainNames.map((chain, index) => (
                        <SelectItem key={`${chain}-${index}`} value={chain}>
                          {chain}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>源代币</Label>
                  <Popover open={sourceTokenPopoverOpen} onOpenChange={setSourceTokenPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={sourceTokenPopoverOpen}
                        className="w-full justify-between"
                      >
                        {formData.sourceToken || "选择源代币"}
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command
                        filter={(value, search) => {
                          if (!search) return 1
                          const searchLower = search.toLowerCase().trim()
                          const valueLower = value.toLowerCase()

                          // 支持多种搜索模式
                          // 1. 直接包含搜索
                          if (valueLower.includes(searchLower)) return 1

                          // 2. 支持 *keyword* 模糊搜索
                          if (searchLower.startsWith("*") && searchLower.endsWith("*")) {
                            const keyword = searchLower.slice(1, -1)
                            if (keyword && valueLower.includes(keyword)) return 1
                          }

                          // 3. 支持 keyword* 前缀搜索
                          if (searchLower.endsWith("*")) {
                            const prefix = searchLower.slice(0, -1)
                            if (prefix && valueLower.startsWith(prefix)) return 1
                          }

                          // 4. 支持 *keyword 后缀搜索
                          if (searchLower.startsWith("*")) {
                            const suffix = searchLower.slice(1)
                            if (suffix && valueLower.endsWith(suffix)) return 1
                          }

                          return 0
                        }}
                      >
                        <CommandInput
                          placeholder="搜索代币 (支持 *SQD* 模糊查询)"
                          value={sourceTokenSearch}
                          onValueChange={setSourceTokenSearch}
                        />
                        {loadingTokens && (
                          <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="ml-2 text-sm text-muted-foreground">加载代币中...</span>
                          </div>
                        )}
                        <CommandEmpty>未找到匹配的代币</CommandEmpty>
                        <CommandList>
                          <CommandGroup>
                            {filteredSourceTokens.map((token) => (
                              <CommandItem
                                key={token.symbol}
                                value={token.symbol}
                                onSelect={(value) => {
                                  handleSelectChange("sourceToken", value)
                                  setSourceTokenPopoverOpen(false)
                                  setSourceTokenSearch("")
                                }}
                              >
                                <div className="flex flex-col">
                                  <span>{token.symbol}</span>
                                  {token.name && token.name !== token.symbol && (
                                    <span className="text-xs text-muted-foreground">{token.name}</span>
                                  )}
                                  {token.address && (
                                    <span className="text-xs text-muted-foreground">
                                      {token.address.substring(0, 6)}...
                                      {token.address.substring(token.address.length - 4)}
                                    </span>
                                  )}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>目标代币</Label>
                  <Popover open={sourceTargetTokenPopoverOpen} onOpenChange={setSourceTargetTokenPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={sourceTargetTokenPopoverOpen}
                        className="w-full justify-between"
                      >
                        {formData.sourceTargetToken || "选择目标代币"}
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command
                        filter={(value, search) => {
                          if (!search) return 1
                          const searchLower = search.toLowerCase().trim()
                          const valueLower = value.toLowerCase()

                          // 支持多种搜索模式
                          // 1. 直接包含搜索
                          if (valueLower.includes(searchLower)) return 1

                          // 2. 支持 *keyword* 模糊搜索
                          if (searchLower.startsWith("*") && searchLower.endsWith("*")) {
                            const keyword = searchLower.slice(1, -1)
                            if (keyword && valueLower.includes(keyword)) return 1
                          }

                          // 3. 支持 keyword* 前缀搜索
                          if (searchLower.endsWith("*")) {
                            const prefix = searchLower.slice(0, -1)
                            if (prefix && valueLower.startsWith(prefix)) return 1
                          }

                          // 4. 支持 *keyword 后缀搜索
                          if (searchLower.startsWith("*")) {
                            const suffix = searchLower.slice(1)
                            if (suffix && valueLower.endsWith(suffix)) return 1
                          }

                          return 0
                        }}
                      >
                        <CommandInput
                          placeholder="搜索代币 (支持 *SQD* 模糊查询)"
                          value={sourceTargetTokenSearch}
                          onValueChange={setSourceTargetTokenSearch}
                        />
                        {loadingTokens && (
                          <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="ml-2 text-sm text-muted-foreground">加载代币中...</span>
                          </div>
                        )}
                        <CommandEmpty>未找到匹配的代币</CommandEmpty>
                        <CommandList>
                          <CommandGroup>
                            {filteredSourceTargetTokens.map((token) => (
                              <CommandItem
                                key={token.symbol}
                                value={token.symbol}
                                onSelect={(value) => {
                                  handleSelectChange("sourceTargetToken", value)
                                  setSourceTargetTokenPopoverOpen(false)
                                  setSourceTargetTokenSearch("")
                                }}
                              >
                                <div className="flex flex-col">
                                  <span>{token.symbol}</span>
                                  {token.name && token.name !== token.symbol && (
                                    <span className="text-xs text-muted-foreground">{token.name}</span>
                                  )}
                                  {token.address && (
                                    <span className="text-xs text-muted-foreground">
                                      {token.address.substring(0, 6)}...
                                      {token.address.substring(token.address.length - 4)}
                                    </span>
                                  )}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-4 border p-4 rounded-lg">
                <h3 className="font-medium text-lg">目标链配置</h3>
                <div className="space-y-2">
                  <Label>选择链</Label>
                  <Select onValueChange={(value) => handleTargetChainChange(value)} value={formData.targetChain}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择目标链" />
                    </SelectTrigger>
                    <SelectContent>
                      {chainNames.map((chain, index) => (
                        <SelectItem key={`${chain}-${index}`} value={chain}>
                          {chain}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>目标代币</Label>
                  <Popover open={targetTokenPopoverOpen} onOpenChange={setTargetTokenPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={targetTokenPopoverOpen}
                        className="w-full justify-between"
                      >
                        {formData.targetToken || "选择目标代币"}
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command
                        filter={(value, search) => {
                          if (!search) return 1
                          const searchLower = search.toLowerCase().trim()
                          const valueLower = value.toLowerCase()

                          // 支持多种搜索模式
                          // 1. 直接包含搜索
                          if (valueLower.includes(searchLower)) return 1

                          // 2. 支持 *keyword* 模糊搜索
                          if (searchLower.startsWith("*") && searchLower.endsWith("*")) {
                            const keyword = searchLower.slice(1, -1)
                            if (keyword && valueLower.includes(keyword)) return 1
                          }

                          // 3. 支持 keyword* 前缀搜索
                          if (searchLower.endsWith("*")) {
                            const prefix = searchLower.slice(0, -1)
                            if (prefix && valueLower.startsWith(prefix)) return 1
                          }

                          // 4. 支持 *keyword 后缀搜索
                          if (searchLower.startsWith("*")) {
                            const suffix = searchLower.slice(1)
                            if (suffix && valueLower.endsWith(suffix)) return 1
                          }

                          return 0
                        }}
                      >
                        <CommandInput
                          placeholder="搜索代币 (支持 *SQD* 模糊查询)"
                          value={targetTokenSearch}
                          onValueChange={setTargetTokenSearch}
                        />
                        {loadingTokens && (
                          <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="ml-2 text-sm text-muted-foreground">加载代币中...</span>
                          </div>
                        )}
                        <CommandEmpty>未找到匹配的代币</CommandEmpty>
                        <CommandList>
                          <CommandGroup>
                            {filteredTargetTokens.map((token) => (
                              <CommandItem
                                key={token.symbol}
                                value={token.symbol}
                                onSelect={(value) => {
                                  handleSelectChange("targetToken", value)
                                  setTargetTokenPopoverOpen(false)
                                  setTargetTokenSearch("")
                                }}
                              >
                                <div className="flex flex-col">
                                  <span>{token.symbol}</span>
                                  {token.name && token.name !== token.symbol && (
                                    <span className="text-xs text-muted-foreground">{token.name}</span>
                                  )}
                                  {token.address && (
                                    <span className="text-xs text-muted-foreground">
                                      {token.address.substring(0, 6)}...
                                      {token.address.substring(token.address.length - 4)}
                                    </span>
                                  )}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>源代币</Label>
                  <Popover open={targetSourceTokenPopoverOpen} onOpenChange={setTargetSourceTokenPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={targetSourceTokenPopoverOpen}
                        className="w-full justify-between"
                      >
                        {formData.targetSourceToken || "选择源代币"}
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command
                        filter={(value, search) => {
                          if (!search) return 1
                          const searchLower = search.toLowerCase().trim()
                          const valueLower = value.toLowerCase()

                          // 支持多种搜索模式
                          // 1. 直接包含搜索
                          if (valueLower.includes(searchLower)) return 1

                          // 2. 支持 *keyword* 模糊搜索
                          if (searchLower.startsWith("*") && searchLower.endsWith("*")) {
                            const keyword = searchLower.slice(1, -1)
                            if (keyword && valueLower.includes(keyword)) return 1
                          }

                          // 3. 支持 keyword* 前缀搜索
                          if (searchLower.endsWith("*")) {
                            const prefix = searchLower.slice(0, -1)
                            if (prefix && valueLower.startsWith(prefix)) return 1
                          }

                          // 4. 支持 *keyword 后缀搜索
                          if (searchLower.startsWith("*")) {
                            const suffix = searchLower.slice(1)
                            if (suffix && valueLower.endsWith(suffix)) return 1
                          }

                          return 0
                        }}
                      >
                        <CommandInput
                          placeholder="搜索代币 (支持 *SQD* 模糊查询)"
                          value={targetSourceTokenSearch}
                          onValueChange={setTargetSourceTokenSearch}
                        />
                        {loadingTokens && (
                          <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="ml-2 text-sm text-muted-foreground">加载代币中...</span>
                          </div>
                        )}
                        <CommandEmpty>未找到匹配的代币</CommandEmpty>
                        <CommandList>
                          <CommandGroup>
                            {filteredTargetSourceTokens.map((token) => (
                              <CommandItem
                                key={token.symbol}
                                value={token.symbol}
                                onSelect={(value) => {
                                  handleSelectChange("targetSourceToken", value)
                                  setTargetSourceTokenPopoverOpen(false)
                                  setTargetSourceTokenSearch("")
                                }}
                              >
                                <div className="flex flex-col">
                                  <span>{token.symbol}</span>
                                  {token.name && token.name !== token.symbol && (
                                    <span className="text-xs text-muted-foreground">{token.name}</span>
                                  )}
                                  {token.address && (
                                    <span className="text-xs text-muted-foreground">
                                      {token.address.substring(0, 6)}...
                                      {token.address.substring(token.address.length - 4)}
                                    </span>
                                  )}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="amount">初始金额</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="输入初始金额"
                  value={formData.amount}
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

      <TokenLoadingIndicator />
    </div>
  )
}
