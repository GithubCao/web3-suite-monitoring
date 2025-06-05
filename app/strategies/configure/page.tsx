"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { 
  getChainNames, 
  getTokensForChain, 
  fetchKyberSwapChains, 
  KyberSwapChain, 
  getCachedTokensForChain,
  getCachedTokenBySymbol,
  forceRefreshKyberSwapCache
} from "@/lib/config"
import { executeArbitrageQuery } from "@/lib/api"
import { getApiProviderOptions } from "@/lib/api-config"
import { Loader2, RefreshCw, Save, Zap, Globe, Key, Settings2 } from "lucide-react"
import { ArbitrageFlowDiagram } from "@/components/arbitrage-flow-diagram"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { addStrategy } from "@/lib/storage"
import type { Strategy, TokenDetail } from "@/lib/types"
import { Checkbox } from "@/components/ui/checkbox"

export default function ConfigureStrategyPage() {
  const router = useRouter()
  const { toast } = useToast()

  // 使用 useState 来管理链名称，避免循环依赖
  const [chainNames, setChainNames] = useState<string[]>([])
  const [apiProviderOptions, setApiProviderOptions] = useState<{ value: string; label: string; description: string }[]>(
    [],
  )
  const [isInitialized, setIsInitialized] = useState(false)

  // KyberSwap链和代币状态
  const [kyberChains, setKyberChains] = useState<KyberSwapChain[]>([])
  const [cachedTokens, setCachedTokens] = useState<Record<string, TokenDetail[]>>({})
  const [useKyberData, setUseKyberData] = useState(true)
  const [loadingKyberData, setLoadingKyberData] = useState(false)

  // 表单状态
  const [formData, setFormData] = useState({
    name: "新套利策略",
    sourceChain: "",
    sourceToken: "",
    sourceTargetToken: "",
    targetChain: "",
    targetToken: "",
    targetSourceToken: "",
    amount: "1",
    slippage: "0.005",
    gasFee: "0.01",
    networkFee: "0.005",
    maxGasPrice: "50",
    gasLimit: "300000",
    bridgeFee: "0.003",
    dexFee: "0.003",
    minProfitPercentage: "1.0",
    autoTrade: false,
    preferredApiProvider: "",
    fallbackApiProviders: [] as string[],
  })

  // 可选代币列表
  const [sourceTokens, setSourceTokens] = useState<string[]>([])
  const [sourceTargetTokens, setSourceTargetTokens] = useState<string[]>([])
  const [targetTokens, setTargetTokens] = useState<string[]>([])
  const [targetSourceTokens, setTargetSourceTokens] = useState<string[]>([])

  // 计算结果
  const [calculationResult, setCalculationResult] = useState<{
    sourceOutputAmount: string
    finalOutputAmount: string
    sourcePrice: number
    targetPrice: number
    profitPercentage: number
    isLoading: boolean
    error: string | null
    sourceApiProvider?: string
    targetApiProvider?: string
  }>({
    sourceOutputAmount: "0",
    finalOutputAmount: "0",
    sourcePrice: 0,
    targetPrice: 0,
    profitPercentage: 0,
    isLoading: false,
    error: null,
  })

  // 初始化函数
  const initializeChains = useCallback(() => {
    if (!isInitialized) {
      const names = getChainNames()
      const apiOptions = getApiProviderOptions()

      setChainNames(names)
      setApiProviderOptions(apiOptions)

      if (names.length > 0) {
        const defaultSourceChain = names[0]
        const sourceTokensList = getTokensForChain(defaultSourceChain)
        const sourceTargetTokensList = [...sourceTokensList]

        setSourceTokens(sourceTokensList)
        setSourceTargetTokens(sourceTargetTokensList)

        setFormData((prev) => ({
          ...prev,
          sourceChain: defaultSourceChain,
          sourceToken: sourceTokensList.length > 0 ? sourceTokensList[0] : "",
          sourceTargetToken: sourceTargetTokensList.length > 1 ? sourceTargetTokensList[1] : sourceTargetTokensList[0],
          preferredApiProvider: apiOptions.length > 0 ? apiOptions[0].value : "",
        }))
      }

      setIsInitialized(true)
    }
  }, [isInitialized])

  // 加载KyberSwap数据
  const loadKyberSwapData = useCallback(async () => {
    try {
      setLoadingKyberData(true);
      
      // 获取KyberSwap支持的链
      const chains = await fetchKyberSwapChains();
      setKyberChains(chains);
      
      // 加载缓存的代币数据
      const tokenCache: Record<string, TokenDetail[]> = {};
      
      // 只加载前5个链的代币数据，避免一次加载过多
      for (let i = 0; i < Math.min(5, chains.length); i++) {
        const chain = chains[i];
        const chainId = chain.chainId;
        const tokens = getCachedTokensForChain(chainId);
        if (tokens.length > 0) {
          tokenCache[chainId] = tokens;
        }
      }
      
      setCachedTokens(tokenCache);
      
      // 如果有KyberSwap链数据，更新默认选择
      if (chains.length > 0) {
        const defaultChain = chains[0];
        const chainName = defaultChain.displayName.toUpperCase().replace(/\s+/g, '_');
        
        // 更新链名称列表
        const kyberChainNames = chains.map(chain => 
          chain.displayName.toUpperCase().replace(/\s+/g, '_')
        );
        
        if (useKyberData) {
          setChainNames(kyberChainNames);
          
          // 更新表单默认值
          if (tokenCache[defaultChain.chainId]?.length > 0) {
            const defaultTokens = tokenCache[defaultChain.chainId];
            setFormData(prev => ({
              ...prev,
              sourceChain: chainName,
              sourceToken: defaultTokens[0]?.symbol || "",
              sourceTargetToken: defaultTokens.length > 1 ? defaultTokens[1].symbol : defaultTokens[0].symbol,
            }));
          }
        }
      }
      
      toast({
        title: "KyberSwap数据加载完成",
        description: `已加载 ${chains.length} 个网络的数据`,
      });
    } catch (error) {
      console.error("加载KyberSwap数据失败:", error);
      toast({
        title: "加载失败",
        description: "无法加载KyberSwap数据，将使用本地配置",
        variant: "destructive",
      });
    } finally {
      setLoadingKyberData(false);
    }
  }, [toast, useKyberData]);

  // 强制刷新KyberSwap缓存
  const refreshKyberSwapCache = async () => {
    try {
      setLoadingKyberData(true);
      toast({
        title: "正在刷新KyberSwap缓存",
        description: "这可能需要几分钟时间...",
      });
      
      // 导入forceRefreshKyberSwapCache函数
      const { forceRefreshKyberSwapCache } = await import("@/lib/config");
      
      // 刷新缓存
      const success = await forceRefreshKyberSwapCache();
      
      if (success) {
        toast({
          title: "KyberSwap缓存刷新成功",
          description: "请重新加载KyberSwap数据",
        });
        
        // 重新加载数据
        await loadKyberSwapData();
      } else {
        toast({
          title: "缓存刷新失败",
          description: "请稍后再试",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("刷新KyberSwap缓存失败:", error);
      toast({
        title: "刷新失败",
        description: "无法刷新KyberSwap缓存",
        variant: "destructive",
      });
    } finally {
      setLoadingKyberData(false);
    }
  };

  // 加载指定链的代币数据
  const loadChainTokens = async (chainId: string) => {
    try {
      if (cachedTokens[chainId]?.length > 0) {
        // 已经加载过此链的代币数据
        return;
      }
      
      setLoadingKyberData(true);
      
      // 获取代币数据
      const tokens = await getCachedTokensForChain(chainId);
      
      if (tokens.length > 0) {
        // 更新缓存
        setCachedTokens(prev => ({
          ...prev,
          [chainId]: tokens
        }));
        
        toast({
          title: "代币数据已加载",
          description: `已加载 ${tokens.length} 个代币数据`,
        });
      } else {
        toast({
          title: "无代币数据",
          description: "未找到该链的缓存代币数据",
        });
      }
    } catch (error) {
      console.error("加载链代币数据失败:", error);
      toast({
        title: "加载失败",
        description: "无法加载代币数据",
        variant: "destructive",
      });
    } finally {
      setLoadingKyberData(false);
    }
  };

  // 初始化链和代币选择
  useEffect(() => {
    initializeChains()
    
    // 如果选择使用KyberSwap数据，则加载
    if (useKyberData) {
      loadKyberSwapData();
    }
  }, [initializeChains, loadKyberSwapData, useKyberData])

  // 当源链变化时更新源代币列表
  const handleSourceChainChange = (value: string) => {
    if (useKyberData) {
      // 查找对应的KyberSwap链
      const kyberChain = kyberChains.find(
        chain => chain.displayName.toUpperCase().replace(/\s+/g, '_') === value
      );
      
      if (kyberChain) {
        const chainId = kyberChain.chainId;
        const chainTokens = cachedTokens[chainId] || [];
        
        if (chainTokens.length > 0) {
          // 使用KyberSwap代币数据
          const tokenSymbols = chainTokens.map(token => token.symbol);
          setSourceTokens(tokenSymbols);
          setSourceTargetTokens(tokenSymbols);
          
          setFormData((prev) => ({
            ...prev,
            sourceChain: value,
            sourceToken: tokenSymbols.length > 0 ? tokenSymbols[0] : "",
            sourceTargetToken: tokenSymbols.length > 1 ? tokenSymbols[1] : tokenSymbols[0],
          }));
          return;
        }
      }
    }
    
    // 回退到原始处理方式
    const tokens = getTokensForChain(value)
    setSourceTokens(tokens)
    setSourceTargetTokens(tokens)

    setFormData((prev) => ({
      ...prev,
      sourceChain: value,
      sourceToken: tokens.length > 0 ? tokens[0] : "",
      sourceTargetToken: tokens.length > 1 ? tokens[1] : tokens[0],
    }))
  }

  // 当目标链变化时更新目标代币列表
  const handleTargetChainChange = (value: string) => {
    if (useKyberData) {
      // 查找对应的KyberSwap链
      const kyberChain = kyberChains.find(
        chain => chain.displayName.toUpperCase().replace(/\s+/g, '_') === value
      );
      
      if (kyberChain) {
        const chainId = kyberChain.chainId;
        const chainTokens = cachedTokens[chainId] || [];
        
        if (chainTokens.length > 0) {
          // 使用KyberSwap代币数据
          const tokenSymbols = chainTokens.map(token => token.symbol);
          setTargetTokens(tokenSymbols);
          setTargetSourceTokens(tokenSymbols);
          
          setFormData((prev) => ({
            ...prev,
            targetChain: value,
            targetToken: tokenSymbols.length > 0 ? tokenSymbols[0] : "",
            targetSourceToken: tokenSymbols.length > 1 ? tokenSymbols[1] : tokenSymbols[0],
          }));
          return;
        }
      }
    }
    
    // 回退到原始处理方式
    const tokens = getTokensForChain(value)
    setTargetTokens(tokens)
    setTargetSourceTokens(tokens)

    setFormData((prev) => ({
      ...prev,
      targetChain: value,
      targetToken: tokens.length > 0 ? tokens[0] : "",
      targetSourceToken: tokens.length > 1 ? tokens[1] : tokens[0],
    }))
  }

  // 处理表单输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // 处理选择变化
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // 处理备用API提供商变化
  const handleFallbackProvidersChange = (providers: string[]) => {
    setFormData((prev) => ({
      ...prev,
      fallbackApiProviders: providers,
    }))
  }

  // 计算套利机会
  const calculateArbitrage = async () => {
    // 验证表单
    if (
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

    setCalculationResult((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }))

    try {
      // 如果使用KyberSwap数据，先确保我们有完整的代币信息
      if (useKyberData) {
        // 查找源链和目标链
        const sourceKyberChain = kyberChains.find(
          chain => chain.displayName.toUpperCase().replace(/\s+/g, '_') === formData.sourceChain
        );
        
        const targetKyberChain = kyberChains.find(
          chain => chain.displayName.toUpperCase().replace(/\s+/g, '_') === formData.targetChain
        );
        
        // 如果链未找到或代币数据未加载，提示用户
        if (!sourceKyberChain || !cachedTokens[sourceKyberChain.chainId]) {
          toast({
            title: "源链代币数据未加载",
            description: "请先加载源链的代币数据",
            variant: "destructive",
          });
          setCalculationResult((prev) => ({
            ...prev,
            isLoading: false,
            error: "源链代币数据未加载，请先点击'加载代币'按钮",
          }));
          return;
        }
        
        if (!targetKyberChain || !cachedTokens[targetKyberChain.chainId]) {
          toast({
            title: "目标链代币数据未加载",
            description: "请先加载目标链的代币数据",
            variant: "destructive",
          });
          setCalculationResult((prev) => ({
            ...prev,
            isLoading: false,
            error: "目标链代币数据未加载，请先点击'加载代币'按钮",
          }));
          return;
        }
      }
      
      const result = await executeArbitrageQuery(
        formData.sourceChain,
        formData.targetChain,
        formData.sourceToken,
        formData.targetToken,
        formData.amount,
        formData.slippage,
        formData.preferredApiProvider || undefined,
        formData.fallbackApiProviders.length > 0 ? formData.fallbackApiProviders : undefined,
        formData.gasFee,
        formData.networkFee,
        formData.bridgeFee,
        formData.dexFee
      )

      setCalculationResult({
        sourceOutputAmount: result.sourceOutputAmount,
        finalOutputAmount: result.finalOutputAmount,
        sourcePrice: result.sourcePrice,
        targetPrice: result.targetPrice,
        profitPercentage: result.profitPercentage,
        isLoading: false,
        error: null,
        sourceApiProvider: result.sourceApiProvider,
        targetApiProvider: result.targetApiProvider,
      })

      // 显示结果通知
      if (result.profitPercentage > 1.0) {
        toast({
          title: "发现套利机会!",
          description: `该策略可能产生 ${result.profitPercentage.toFixed(2)}% 的利润`,
          variant: "default",
        })
      } else if (result.profitPercentage > 0) {
        toast({
          title: "计算完成",
          description: `该策略可能产生 ${result.profitPercentage.toFixed(2)}% 的利润，但可能不足以覆盖交易费用`,
        })
      } else {
        toast({
          title: "计算完成",
          description: `该策略当前无法产生利润 (${result.profitPercentage.toFixed(2)}%)`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("计算套利机会时出错:", error)
      setCalculationResult((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "计算过程中发生未知错误",
      }))

      toast({
        title: "计算失败",
        description: error instanceof Error ? error.message : "计算过程中发生未知错误",
        variant: "destructive",
      })
    }
  }

  // 保存策略函数
  const saveStrategy = () => {
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

    // 创建新策略
    const newStrategy: Strategy = {
      id: crypto.randomUUID(),
      name: formData.name,
      description: `${formData.sourceChain}上的${formData.sourceToken}到${formData.targetChain}上的${formData.targetToken}套利策略`,
      sourceChain: formData.sourceChain,
      targetChain: formData.targetChain,
      sourceToken: formData.sourceToken,
      targetToken: formData.targetToken,
      amount: formData.amount,
      minProfitPercentage: parseFloat(formData.minProfitPercentage),
      enabled: false,
      preferredApiProvider: formData.preferredApiProvider || undefined,
      fallbackApiProviders: formData.fallbackApiProviders.length > 0 ? formData.fallbackApiProviders : undefined,
      gasFee: formData.gasFee,
      networkFee: formData.networkFee,
      bridgeFee: formData.bridgeFee,
      dexFee: formData.dexFee,
      interval: 60000, // 默认每分钟检查一次
    }

    // 保存策略
    addStrategy(newStrategy)

    toast({
      title: "策略已创建",
      description: "套利策略已成功创建",
    })

    // 重定向到策略列表
    router.push("/strategies")
  }

  // 获取利润颜色
  const getProfitColor = (profit: number) => {
    if (profit > 1.0) return "text-green-500"
    if (profit > 0) return "text-green-400"
    if (profit < 0) return "text-red-500"
    return "text-muted-foreground"
  }

  // 获取API提供商图标
  const getApiProviderIcon = (provider: string) => {
    if (provider.includes("1inch")) return <Zap className="h-4 w-4" />
    if (provider.includes("paraswap") || provider.includes("0x")) return <Key className="h-4 w-4" />
    return <Globe className="h-4 w-4" />
  }

  if (!isInitialized) {
    return <div className="flex items-center justify-center h-full">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">配置套利策略</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="useKyberData"
              checked={useKyberData}
              onCheckedChange={(checked) => setUseKyberData(checked as boolean)}
            />
            <label
              htmlFor="useKyberData"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              使用KyberSwap数据
            </label>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadKyberSwapData}
            disabled={loadingKyberData || !useKyberData}
          >
            {loadingKyberData ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                加载中...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                刷新KyberSwap数据
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshKyberSwapCache}
            disabled={loadingKyberData}
            className="text-yellow-600 border-yellow-300 hover:bg-yellow-50"
          >
            <Settings2 className="mr-2 h-4 w-4" />
            强制刷新缓存
          </Button>
        </div>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">基本配置</TabsTrigger>
          <TabsTrigger value="api">API设置</TabsTrigger>
          <TabsTrigger value="advanced">高级设置</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>策略基本信息</CardTitle>
              <CardDescription>设置套利策略的基本参数</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {useKyberData && (
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <div className="flex items-start space-x-2">
                    <Globe className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="w-full">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-blue-900">KyberSwap数据状态</h4>
                        <Badge variant={Object.keys(cachedTokens).length > 0 ? "default" : "outline"} className="text-xs">
                          {Object.keys(cachedTokens).length > 0 ? "已加载" : "未加载"}
                        </Badge>
                      </div>
                      <p className="text-xs text-blue-700 mt-1">
                        已加载 {kyberChains.length} 个网络和 {Object.values(cachedTokens).reduce((acc, tokens) => acc + tokens.length, 0)} 个代币
                      </p>
                      {kyberChains.length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs font-medium text-blue-800 mb-1">已加载的网络:</div>
                          <div className="flex flex-wrap gap-1">
                            {kyberChains.slice(0, 5).map(chain => (
                              <Badge key={chain.chainId} variant="outline" className="text-xs flex items-center gap-1">
                                {chain.logoUrl && (
                                  <img 
                                    src={chain.logoUrl} 
                                    alt={chain.displayName}
                                    className="w-3 h-3 rounded-full"
                                  />
                                )}
                                <span>{chain.displayName}</span>
                                {cachedTokens[chain.chainId]?.length > 0 && (
                                  <span className="text-green-600 text-[10px]">
                                    ({cachedTokens[chain.chainId].length})
                                  </span>
                                )}
                              </Badge>
                            ))}
                            {kyberChains.length > 5 && (
                              <Badge variant="outline" className="text-xs">
                                +{kyberChains.length - 5}个网络
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                      {Object.keys(cachedTokens).length > 0 && (
                        <div className="mt-2 text-xs text-blue-700">
                          <div className="flex items-center justify-between">
                            <span>已加载代币的网络: {Object.keys(cachedTokens).length}个</span>
                            <span className="text-[10px] text-blue-500">
                              点击"加载代币"按钮获取更多代币数据
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

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
                        {useKyberData && kyberChains.length > 0 ? (
                          kyberChains.map((chain) => (
                            <SelectItem 
                              key={chain.chainId} 
                              value={chain.displayName.toUpperCase().replace(/\s+/g, '_')}
                            >
                              <div className="flex items-center gap-2">
                                {chain.logoUrl && (
                                  <img 
                                    src={chain.logoUrl} 
                                    alt={chain.displayName}
                                    className="w-4 h-4 rounded-full"
                                  />
                                )}
                                {chain.displayName}
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          chainNames.map((chain) => (
                            <SelectItem key={chain} value={chain}>
                              {chain}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>源代币</Label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Select
                          onValueChange={(value) => handleSelectChange("sourceToken", value)}
                          value={formData.sourceToken}
                          disabled={!formData.sourceChain}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="选择源代币" />
                          </SelectTrigger>
                          <SelectContent>
                            {sourceTokens.map((token, index) => (
                              <SelectItem key={`${token}-${index}`} value={token}>
                                {token}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {useKyberData && formData.sourceChain && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const kyberChain = kyberChains.find(
                              chain => chain.displayName.toUpperCase().replace(/\s+/g, '_') === formData.sourceChain
                            );
                            if (kyberChain) {
                              loadChainTokens(kyberChain.chainId);
                            }
                          }}
                          disabled={loadingKyberData}
                          className="whitespace-nowrap"
                        >
                          {loadingKyberData ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "加载代币"
                          )}
                        </Button>
                      )}
                    </div>
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
                        {sourceTargetTokens.map((token, index) => (
                          <SelectItem key={`${token}-${index}`} value={token}>
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
                        {useKyberData && kyberChains.length > 0 ? (
                          kyberChains.map((chain) => (
                            <SelectItem 
                              key={chain.chainId} 
                              value={chain.displayName.toUpperCase().replace(/\s+/g, '_')}
                            >
                              <div className="flex items-center gap-2">
                                {chain.logoUrl && (
                                  <img 
                                    src={chain.logoUrl} 
                                    alt={chain.displayName}
                                    className="w-4 h-4 rounded-full"
                                  />
                                )}
                                {chain.displayName}
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          chainNames.map((chain) => (
                            <SelectItem key={chain} value={chain}>
                              {chain}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>目标代币</Label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Select
                          onValueChange={(value) => handleSelectChange("targetToken", value)}
                          value={formData.targetToken}
                          disabled={!formData.targetChain}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="选择目标代币" />
                          </SelectTrigger>
                          <SelectContent>
                            {targetTokens.map((token, index) => (
                              <SelectItem key={`${token}-${index}`} value={token}>
                                {token}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {useKyberData && formData.targetChain && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const kyberChain = kyberChains.find(
                              chain => chain.displayName.toUpperCase().replace(/\s+/g, '_') === formData.targetChain
                            );
                            if (kyberChain) {
                              loadChainTokens(kyberChain.chainId);
                            }
                          }}
                          disabled={loadingKyberData}
                          className="whitespace-nowrap"
                        >
                          {loadingKyberData ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "加载代币"
                          )}
                        </Button>
                      )}
                    </div>
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
                        {targetSourceTokens.map((token, index) => (
                          <SelectItem key={`${token}-${index}`} value={token}>
                            {token}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

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

              <div className="flex justify-end">
                <Button
                  onClick={calculateArbitrage}
                  disabled={calculationResult.isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {calculationResult.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {calculationResult.isLoading ? "计算中..." : "计算套利机会"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 计算结果卡片 */}
          {(calculationResult.sourcePrice > 0 || calculationResult.error) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>套利计算结果</span>
                  <div className="flex items-center space-x-2">
                    {calculationResult.sourceApiProvider && (
                      <Badge variant="outline" className="flex items-center space-x-1">
                        {getApiProviderIcon(calculationResult.sourceApiProvider)}
                        <span>
                          {apiProviderOptions.find((opt) => opt.value === calculationResult.sourceApiProvider)?.label}
                        </span>
                      </Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={calculateArbitrage}
                      disabled={calculationResult.isLoading}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      刷新计算
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>
                  {formData.sourceChain} 和 {formData.targetChain} 之间的套利机会
                </CardDescription>
              </CardHeader>
              <CardContent>
                {calculationResult.error ? (
                  <div className="bg-red-50 text-red-600 p-4 rounded-md">{calculationResult.error}</div>
                ) : (
                  <div className="space-y-6">
                    <ArbitrageFlowDiagram
                      sourceChain={formData.sourceChain}
                      targetChain={formData.targetChain}
                      sourceToken={formData.sourceToken}
                      targetToken={formData.targetToken}
                      sourceTargetToken={formData.sourceTargetToken}
                      targetSourceToken={formData.targetSourceToken}
                      amount={formData.amount}
                      initialAmount={formData.amount}
                      sourceOutputAmount={calculationResult.sourceOutputAmount}
                      finalOutputAmount={calculationResult.finalOutputAmount}
                      profitPercentage={calculationResult.profitPercentage}
                    />

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium mb-1 flex items-center space-x-2">
                          <span>源链价格</span>
                          {calculationResult.sourceApiProvider && (
                            <Badge variant="secondary" className="text-xs">
                              {
                                apiProviderOptions.find((opt) => opt.value === calculationResult.sourceApiProvider)
                                  ?.label
                              }
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm">
                          1 {formData.sourceToken} = {calculationResult.sourcePrice.toFixed(8)}{" "}
                          {formData.sourceTargetToken}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium mb-1 flex items-center space-x-2">
                          <span>目标链价格</span>
                          {calculationResult.targetApiProvider && (
                            <Badge variant="secondary" className="text-xs">
                              {
                                apiProviderOptions.find((opt) => opt.value === calculationResult.targetApiProvider)
                                  ?.label
                              }
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm">
                          1 {formData.targetToken} = {calculationResult.targetPrice.toFixed(8)}{" "}
                          {formData.targetSourceToken}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium mb-1">套利利润</div>
                        <div className={`text-lg font-bold ${getProfitColor(calculationResult.profitPercentage)}`}>
                          {(
                            Number.parseFloat(calculationResult.finalOutputAmount) -
                            Number.parseFloat(formData.amount)
                          ).toFixed(6)}{" "}
                          {formData.sourceToken} ({calculationResult.profitPercentage.toFixed(2)}%)
                        </div>
                      </div>
                      <Badge
                        variant={calculationResult.profitPercentage > 1.0 ? "default" : "outline"}
                        className={
                          calculationResult.profitPercentage > 1.0
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : ""
                        }
                      >
                        {calculationResult.profitPercentage > 1.0 ? "有利可图" : "无利可图"}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button
                  onClick={saveStrategy}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="mr-2 h-4 w-4" />
                  保存策略
                </Button>
              </CardFooter>
            </Card>
          )}
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
                        checked={formData.fallbackApiProviders.includes(option.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleFallbackProvidersChange([...formData.fallbackApiProviders, option.value])
                          } else {
                            handleFallbackProvidersChange(
                              formData.fallbackApiProviders.filter((id) => id !== option.value),
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

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Settings2 className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">API配置提示</h4>
                    <p className="text-xs text-blue-700 mt-1">
                      您可以在设置页面的"API配置"选项卡中管理API提供商的详细配置，包括API密钥、超时设置等。
                    </p>
                  </div>
                </div>
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
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="autoTrade"
                  checked={formData.autoTrade}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, autoTrade: checked as boolean }))}
                />
                <label
                  htmlFor="autoTrade"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  启用自动交易
                </label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
