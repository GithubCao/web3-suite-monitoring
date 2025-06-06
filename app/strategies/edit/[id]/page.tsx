/* eslint-disable react/no-unescaped-entities */
"use client"

// 抑制Next.js关于params参数的警告
// @ts-ignore -- TODO: 将来需要使用React.use()解包params参数

import type React from "react"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import type { Strategy as BaseStrategy, TokenDetail } from "@/lib/types"
import { getStrategyById, updateStrategy } from "@/lib/storage"
import { 
  getChainNames, 
  getTokensForChain, 
  getCachedTokensForChain,
  fetchKyberSwapChains,
  type KyberSwapChain, 
  getCurrentConfig, 
  forceRefreshConfig, 
  getTokensForChain as getLatestTokens 
} from "@/lib/config"
import { executeArbitrageQuery } from "@/lib/api"
import { getApiProviderOptions } from "@/lib/api-config"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Search, 
  Loader2, 
  RefreshCw, 
  Save, 
  Zap, 
  Globe, 
  Key, 
  Settings2, 
  Check, 
  ChevronsUpDown, 
  AlertCircle,
  Wallet
} from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ArbitrageFlowDiagram } from "@/components/arbitrage-flow-diagram"
import { WalletSelector } from "@/components/wallet-selector"
import { Switch } from "@/components/ui/switch"

// 扩展Strategy类型以包含额外的属性
type Strategy = BaseStrategy & {
  autoTrading?: boolean;
  active?: boolean;
  priority?: string;
  minProfitUsd?: string;
  minProfitPercent?: string;
  maxPriceImpact?: string;
  fallbackApiProviders: string[];
};

export default function EditStrategyPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const id = params.id as string

  // 在组件开始部分添加调试日志
  console.log("编辑策略页面初始化，ID:", params.id);

  // 初始状态设置为加载中
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // 使用 useState 来管理链名称，避免循环依赖
  const [chainNames, setChainNames] = useState<string[]>([])
  const [apiProviderOptions, setApiProviderOptions] = useState<{ value: string; label: string; description: string }[]>(
    [],
  )

  // KyberSwap链和代币状态
  const [kyberChains, setKyberChains] = useState<KyberSwapChain[]>([])
  const [cachedTokens, setCachedTokens] = useState<Record<string, TokenDetail[]>>({})
  const [useKyberData, setUseKyberData] = useState(true)
  const [loadingKyberData, setLoadingKyberData] = useState(false)

  // 表单状态
  const [formData, setFormData] = useState<Strategy>({
    id: "",
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
    walletAddress: "",
    preferredApiProvider: "",
    fallbackApiProviders: [],
    interval: 60000,
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

  // 代币详情状态
  const [sourceTokenDetails, setSourceTokenDetails] = useState<TokenDetail[]>([])
  const [targetTokenDetails, setTargetTokenDetails] = useState<TokenDetail[]>([])
  
  // 搜索状态
  const [sourceTokenSearch, setSourceTokenSearch] = useState("")
  const [sourceTargetTokenSearch, setSourceTargetTokenSearch] = useState("")
  const [targetTokenSearch, setTargetTokenSearch] = useState("")
  const [targetSourceTokenSearch, setTargetSourceTokenSearch] = useState("")
  
  const [sourceTokenOpen, setSourceTokenOpen] = useState(false)
  const [sourceTargetTokenOpen, setSourceTargetTokenOpen] = useState(false)
  const [targetTokenOpen, setTargetTokenOpen] = useState(false)
  const [targetSourceTokenOpen, setTargetSourceTokenOpen] = useState(false)
  
  const [loadingTokens, setLoadingTokens] = useState(false)

  // 添加isSubmitting状态变量
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 在组件挂载时刷新配置
  useEffect(() => {
    forceRefreshConfig()
  }, [])

  // 获取链ID的辅助函数
  const getChainId = useCallback((chainName: string): number | null => {
    try {
      const { chains } = getCurrentConfig()
      return chains[chainName] || null
    } catch (error) {
      console.error(`获取链ID失败: ${error}`)
      return null
    }
  }, [])

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
    [toast, getChainId],
  )

  // 添加懒加载代币详情的函数
  const lazyLoadTokenDetails = useCallback(
    (chainName: string, isSourceChain: boolean) => {
      if (loadingTokens) return

      const tokenDetails = isSourceChain ? sourceTokenDetails : targetTokenDetails
      if (tokenDetails.length > 0) return

      loadTokenDetails(chainName, isSourceChain)
    },
    [loadingTokens, sourceTokenDetails, targetTokenDetails, loadTokenDetails],
  )

  // 获取代币详情
  const getTokenDetails = useCallback(
    (chainName: string): TokenDetail[] => {
      if (useKyberData) {
        const kyberChain = kyberChains.find(
          (chain) => chain.displayName.toUpperCase().replace(/\s+/g, "_") === chainName,
        )

        if (kyberChain && cachedTokens[kyberChain.chainId]) {
          return cachedTokens[kyberChain.chainId]
        }
      }

      // 回退到基本代币列表
      const tokens = getTokensForChain(chainName)
      return tokens.map((symbol) => ({
        symbol,
        name: symbol,
        address: `0x${symbol.toLowerCase()}`,
        decimals: 18,
        chainId: 0,
        logoUrl: "",
      }))
    },
    [useKyberData, kyberChains, cachedTokens],
  )

  // 加载KyberSwap数据
  const loadKyberSwapData = useCallback(async () => {
    try {
      setLoadingKyberData(true)
      
      // 获取KyberSwap支持的链
      const chains = await fetchKyberSwapChains()
      setKyberChains(chains)

      // 加载缓存的代币数据
      const tokenCache: Record<string, TokenDetail[]> = {}

      // 只加载前5个链的代币数据，避免一次加载过多
      for (let i = 0; i < Math.min(5, chains.length); i++) {
        const chain = chains[i]
        const chainId = chain.chainId
        const tokens = getCachedTokensForChain(chainId)
        if (tokens.length > 0) {
          tokenCache[chainId] = tokens
        }
      }

      setCachedTokens(tokenCache)

      // 如果有KyberSwap链数据，更新默认选择
      if (chains.length > 0) {
        const defaultChain = chains[0]
        const chainName = defaultChain.displayName.toUpperCase().replace(/\s+/g, "_")

        // 更新链名称列表
        const kyberChainNames = chains.map((chain) => chain.displayName.toUpperCase().replace(/\s+/g, "_"))

        if (useKyberData) {
          setChainNames(kyberChainNames)
        }
      }

      toast({
        title: "KyberSwap数据加载完成",
        description: `已加载 ${chains.length} 个网络的数据`,
      })
    } catch (error) {
      console.error("加载KyberSwap数据失败:", error)
      toast({
        title: "加载失败",
        description: "无法加载KyberSwap数据，将使用本地配置",
        variant: "destructive",
      })
    } finally {
      setLoadingKyberData(false)
    }
  }, [toast, useKyberData])

  // 强制刷新KyberSwap缓存
  const refreshKyberSwapCache = async () => {
    try {
      setLoadingKyberData(true)
      toast({
        title: "正在刷新KyberSwap缓存",
        description: "这可能需要几分钟时间...",
      })

      // 导入forceRefreshKyberSwapCache函数
      const { forceRefreshKyberSwapCache } = await import("@/lib/config")

      // 刷新缓存
      const success = await forceRefreshKyberSwapCache()

      if (success) {
        toast({
          title: "KyberSwap缓存刷新成功",
          description: "请重新加载KyberSwap数据",
        })

        // 重新加载数据
        await loadKyberSwapData()
      } else {
        toast({
          title: "缓存刷新失败",
          description: "请稍后再试",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("刷新KyberSwap缓存失败:", error)
      toast({
        title: "刷新失败",
        description: "无法刷新KyberSwap缓存",
        variant: "destructive",
      })
    } finally {
      setLoadingKyberData(false)
    }
  }

  // 加载指定链的代币数据
  const loadChainTokens = async (chainId: string) => {
    try {
      if (cachedTokens[chainId]?.length > 0) {
        // 已经加载过此链的代币数据
        return
      }

      setLoadingKyberData(true)

      // 获取代币数据
      const tokens = await getCachedTokensForChain(chainId)

      if (tokens.length > 0) {
        // 更新缓存
        setCachedTokens((prev) => ({
          ...prev,
          [chainId]: tokens,
        }))

        toast({
          title: "代币数据已加载",
          description: `已加载 ${tokens.length} 个代币数据`,
        })
      } else {
        toast({
          title: "无代币数据",
          description: "未找到该链的缓存代币数据",
        })
      }
    } catch (error) {
      console.error("加载链代币数据失败:", error)
      toast({
        title: "加载失败",
        description: "无法加载代币数据",
        variant: "destructive",
      })
    } finally {
      setLoadingKyberData(false)
    }
  }

  // 当打开下拉框时懒加载代币详情
  useEffect(() => {
    if (sourceTokenOpen && formData.sourceChain) {
      lazyLoadTokenDetails(formData.sourceChain, true)
    }
  }, [sourceTokenOpen, formData.sourceChain, lazyLoadTokenDetails])

  useEffect(() => {
    if (sourceTargetTokenOpen && formData.sourceChain) {
      lazyLoadTokenDetails(formData.sourceChain, true)
    }
  }, [sourceTargetTokenOpen, formData.sourceChain, lazyLoadTokenDetails])

  useEffect(() => {
    if (targetTokenOpen && formData.targetChain) {
      lazyLoadTokenDetails(formData.targetChain, false)
    }
  }, [targetTokenOpen, formData.targetChain, lazyLoadTokenDetails])

  useEffect(() => {
    if (targetSourceTokenOpen && formData.targetChain) {
      lazyLoadTokenDetails(formData.targetChain, false)
    }
  }, [targetSourceTokenOpen, formData.targetChain, lazyLoadTokenDetails])

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

  // 初始化链和代币选择
  const initializeChains = () => {
    console.log("初始化链和代币选择")
    if (useKyberData) {
      loadKyberSwapData()
    }
    
    // 设置初始化状态为true
    setIsInitialized(true)
  }

  useEffect(() => {
    initializeChains()
  }, [useKyberData])

  // 添加调试日志
  useEffect(() => {
    console.log("当前正在编辑的策略ID:", id);
  }, [id]);

  // 修改加载策略数据的逻辑
  useEffect(() => {
    // 定义loadStrategy函数
    const loadStrategy = async () => {
      console.log(`正在加载策略 (ID: ${id})`);
      setLoading(true);
      
      try {
        // 确保策略ID存在
        if (!id) {
          toast({
            title: "无效的策略ID",
            description: "请从策略列表选择一个有效的策略",
            variant: "destructive",
          });
          router.push("/strategies");
          return;
        }
        
        // 强制刷新配置
        forceRefreshConfig();
        
        // 获取链名称和API提供商选项
        const chainNamesArray = getChainNames();
        const apiProvidersArray = getApiProviderOptions();
        
        setChainNames(chainNamesArray);
        setApiProviderOptions(apiProvidersArray);
        
        // 获取策略数据
        const strategy = getStrategyById(id);
        console.log("从存储中获取的策略数据:", strategy);
        
        if (!strategy) {
          toast({
            title: "找不到策略",
            description: `无法找到ID为 ${id} 的策略`,
            variant: "destructive",
          });
          router.push("/strategies");
          return;
        }
        
        // 更新表单数据
        setFormData({
          ...strategy,
          preferredApiProvider: strategy.preferredApiProvider || "PARASWAP",
          fallbackApiProviders: strategy.fallbackApiProviders || [],
          autoTrading: strategy.autoTrade || false,
        });
        
        // 加载代币详情
        try {
          await loadTokenDetails(strategy.sourceChain, true);
          await loadTokenDetails(strategy.targetChain, false);
        } catch (tokenError) {
          console.error("加载代币详情失败:", tokenError);
        }
        
        // 设置初始化完成
        setIsInitialized(true);
      } catch (error) {
        console.error("加载策略数据失败:", error);
        toast({
          title: "加载失败",
          description: "加载策略数据时发生错误",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    // 调用loadStrategy函数
    loadStrategy();
  }, [id, router, toast, loadTokenDetails]);

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

  // 当源链变化时更新源代币列表
  const handleSourceChainChange = (value: string) => {
    // 强制刷新配置以获取最新代币
    forceRefreshConfig()

    // 加载代币详情
    loadTokenDetails(value, true)

    if (useKyberData) {
      // 查找对应的KyberSwap链
      const kyberChain = kyberChains.find((chain) => chain.displayName.toUpperCase().replace(/\s+/g, "_") === value)

      if (kyberChain) {
        const chainId = kyberChain.chainId
        const chainTokens = cachedTokens[chainId] || []

        if (chainTokens.length > 0) {
          // 使用KyberSwap代币数据
          const tokenSymbols = chainTokens.map((token) => token.symbol)
          setSourceTokens(tokenSymbols)
          setSourceTargetTokens(tokenSymbols)

          setFormData((prev) => ({
            ...prev,
            sourceChain: value,
            sourceToken: tokenSymbols.length > 0 ? tokenSymbols[0] : "",
            sourceTargetToken: tokenSymbols.length > 1 ? tokenSymbols[1] : tokenSymbols[0],
          }))

          const tokenDetails = getTokenDetails(value)
          setSourceTokenDetails(tokenDetails)
          return
        }
      }
    }

    // 回退到原始处理方式
    const tokens = getLatestTokens(value)
    setSourceTokens(tokens)
    setSourceTargetTokens(tokens)

    setFormData((prev) => ({
      ...prev,
      sourceChain: value,
      sourceToken: tokens.length > 0 ? tokens[0] : "",
      sourceTargetToken: tokens.length > 1 ? tokens[1] : tokens[0],
    }))

    console.log(`源链 ${value} 可用代币数量: ${tokens.length}`)
  }

  // 当目标链变化时更新目标代币列表
  const handleTargetChainChange = (value: string) => {
    // 强制刷新配置以获取最新代币
    forceRefreshConfig()

    // 加载代币详情
    loadTokenDetails(value, false)

    if (useKyberData) {
      // 查找对应的KyberSwap链
      const kyberChain = kyberChains.find((chain) => chain.displayName.toUpperCase().replace(/\s+/g, "_") === value)

      if (kyberChain) {
        const chainId = kyberChain.chainId
        const chainTokens = cachedTokens[chainId] || []

        if (chainTokens.length > 0) {
          // 使用KyberSwap代币数据
          const tokenSymbols = chainTokens.map((token) => token.symbol)
          setTargetTokens(tokenSymbols)
          setTargetSourceTokens(tokenSymbols)

          setFormData((prev) => ({
            ...prev,
            targetChain: value,
            targetToken: tokenSymbols.length > 0 ? tokenSymbols[0] : "",
            targetSourceToken: tokenSymbols.length > 1 ? tokenSymbols[1] : tokenSymbols[0],
          }))

          const tokenDetails = getTokenDetails(value)
          setTargetTokenDetails(tokenDetails)
          return
        }
      }
    }

    // 回退到原始处理方式
    const tokens = getLatestTokens(value)
    setTargetTokens(tokens)
    setTargetSourceTokens(tokens)

    setFormData((prev) => ({
      ...prev,
      targetChain: value,
      targetToken: tokens.length > 0 ? tokens[0] : "",
      targetSourceToken: tokens.length > 1 ? tokens[1] : tokens[0],
    }))

    console.log(`目标链 ${value} 可用代币数量: ${tokens.length}`)
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

  // 修复连接钱包按钮的onClick处理器
  const handleConnectWallet = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        if (accounts && accounts.length > 0) {
          setFormData((prev) => ({ ...prev, walletAddress: accounts[0] }));
          toast({
            title: "成功",
            description: "已连接钱包",
          });
        }
      } catch (err) {
        console.error("连接钱包失败:", err);
        toast({
          title: "错误",
          description: "连接钱包失败",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "错误",
        description: "未检测到MetaMask钱包",
        variant: "destructive",
      });
    }
  };

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
          (chain) => chain.displayName.toUpperCase().replace(/\s+/g, "_") === formData.sourceChain,
        )

        const targetKyberChain = kyberChains.find(
          (chain) => chain.displayName.toUpperCase().replace(/\s+/g, "_") === formData.targetChain,
        )

        // 如果链未找到或代币数据未加载，提示用户
        if (!sourceKyberChain || !cachedTokens[sourceKyberChain.chainId]) {
          toast({
            title: "源链代币数据未加载",
            description: "请先加载源链的代币数据",
            variant: "destructive",
          })
          setCalculationResult((prev) => ({
            ...prev,
            isLoading: false,
            error: "源链代币数据未加载，请先点击'加载代币'按钮",
          }))
          return
        }

        if (!targetKyberChain || !cachedTokens[targetKyberChain.chainId]) {
          toast({
            title: "目标链代币数据未加载",
            description: "请先加载目标链的代币数据",
            variant: "destructive",
          })
          setCalculationResult((prev) => ({
            ...prev,
            isLoading: false,
            error: "目标链代币数据未加载，请先点击'加载代币'按钮",
          }))
          return
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
        formData.dexFee,
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

  // 获取利润颜色
  const getProfitColor = (profit: number) => {
    if (profit > 1.0) return "text-green-500"
    if (profit > 0) return "text-green-400"
    if (profit < 0) return "text-red-500"
    return "text-muted-foreground"
  }

  // 获取API提供商图标
  const getApiProviderIcon = (provider: string) => {
    if (provider?.includes("1inch")) return <Zap className="h-4 w-4" />
    if (provider?.includes("paraswap") || provider?.includes("0x")) return <Key className="h-4 w-4" />
    return <Globe className="h-4 w-4" />
  }

  // 代币搜索选择器组件
  const TokenSelector = ({
    value,
    onValueChange,
    tokens,
    placeholder,
    open,
    onOpenChange,
    disabled = false,
    onLoadTokens,
    searchValue,
    onSearchChange,
  }: {
    value: string
    onValueChange: (value: string) => void
    tokens: TokenDetail[]
    placeholder: string
    open: boolean
    onOpenChange: (open: boolean) => void
    disabled?: boolean
    onLoadTokens?: () => void
    searchValue: string
    onSearchChange: (value: string) => void
  }) => {
    const selectedToken = tokens.find((token) => token.symbol === value)

    return (
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={onOpenChange}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="flex-1 justify-between"
              disabled={disabled}
            >
              {selectedToken ? (
                <div className="flex items-center gap-2">
                  {selectedToken.logoURI && (
                    <img
                      src={selectedToken.logoURI || "/placeholder.svg?height=16&width=16"}
                      alt={selectedToken.symbol}
                      className="w-4 h-4 rounded-full"
                    />
                  )}
                  <span>{selectedToken.symbol}</span>
                  {selectedToken.address && (
                    <span className="text-xs text-muted-foreground">
                      {selectedToken.address.slice(0, 6)}...{selectedToken.address.slice(-4)}
                    </span>
                  )}
                </div>
              ) : (
                placeholder
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0">
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
                className="h-9"
                value={searchValue}
                onValueChange={onSearchChange}
              />
              {loadingTokens && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2 text-sm text-muted-foreground">加载代币中...</span>
                </div>
              )}
              <CommandList>
                <CommandEmpty>未找到匹配的代币</CommandEmpty>
                <CommandGroup>
                  {tokens.map((token) => (
                    <CommandItem
                      key={`${token.symbol}-${token.address}`}
                      value={`${token.symbol} ${token.name} ${token.address}`.toLowerCase()}
                      onSelect={() => {
                        onValueChange(token.symbol)
                        onOpenChange(false)
                        onSearchChange("")
                      }}
                    >
                      <div className="flex items-center gap-2 w-full">
                        {token.logoURI && (
                          <img
                            src={token.logoURI || "/placeholder.svg?height=16&width=16"}
                            alt={token.symbol}
                            className="w-4 h-4 rounded-full"
                          />
                        )}
                        <div className="flex-1">
                          <div className="font-medium">{token.symbol}</div>
                          {token.name && token.name !== token.symbol && (
                            <div className="text-xs text-muted-foreground">{token.name}</div>
                          )}
                        </div>
                        {token.address && (
                          <div className="text-xs text-muted-foreground font-mono">
                            {token.address.slice(0, 6)}...{token.address.slice(-4)}
                          </div>
                        )}
                        <Check
                          className={cn("ml-auto h-4 w-4", value === token.symbol ? "opacity-100" : "opacity-0")}
                        />
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {onLoadTokens && (
          <Button
            variant="outline"
            size="sm"
            onClick={onLoadTokens}
            disabled={loadingTokens}
            className="whitespace-nowrap"
          >
            {loadingTokens ? <Loader2 className="h-4 w-4 animate-spin" /> : "加载代币"}
          </Button>
        )}
      </div>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      console.log("提交策略表单，策略ID:", id);
      
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
        });
        setIsSubmitting(false);
        return;
      }
      
      // 构建更新后的策略对象
      const updatedStrategy = {
        ...formData,
        id, // 确保ID正确
        minProfitPercentage: Number.parseFloat(formData.minProfitPercentage?.toString() || "1.0"),
        description: `${formData.sourceChain}上的${formData.sourceToken}到${formData.targetChain}上的${formData.targetToken}套利策略`,
        autoTrade: formData.autoTrading || false,
      } as Strategy;
      
      console.log("正在保存更新后的策略:", updatedStrategy);
      
      // 保存策略
      updateStrategy(updatedStrategy);
      
      toast({
        title: "保存成功",
        description: "策略已成功更新",
      });
      
      // 短暂延迟后跳转，以便用户看到保存成功的提示
      setTimeout(() => {
        router.push("/strategies");
      }, 1000);
    } catch (error) {
      console.error("保存策略失败:", error);
      toast({
        title: "保存失败",
        description: "保存策略时发生错误",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 添加加载状态和空数据UI处理
  // 添加更多的UI调试输出
  if (loading) {
    console.log("页面加载中...");
    return (
      <div className="container mx-auto py-10 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg font-medium">正在加载策略数据...</p>
      </div>
    );
  }

  if (!formData.id) {
    console.log("策略数据为空，显示错误消息");
    return (
      <div className="container mx-auto py-10">
        <Card className="w-full p-6">
          <CardHeader>
            <CardTitle className="text-red-500">加载失败</CardTitle>
            <CardDescription>无法加载策略数据</CardDescription>
          </CardHeader>
          <CardContent>
            <p>找不到请求的策略，可能已被删除或ID无效。</p>
            <p className="text-gray-500 text-sm mt-2">策略ID: {id}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push('/strategies')}>
              返回策略列表
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">编辑策略</h1>
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
          <Button variant="outline" size="sm" onClick={loadKyberSwapData} disabled={loadingKyberData || !useKyberData}>
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">基本配置</TabsTrigger>
          <TabsTrigger value="wallet">钱包设置</TabsTrigger>
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
                        <Badge
                          variant={Object.keys(cachedTokens).length > 0 ? "default" : "outline"}
                          className="text-xs"
                        >
                          {Object.keys(cachedTokens).length > 0 ? "已加载" : "未加载"}
                        </Badge>
                      </div>
                      <p className="text-xs text-blue-700 mt-1">
                        已加载 {kyberChains.length} 个网络的数据，
                        {Object.values(cachedTokens).reduce((acc, tokens) => acc + tokens.length, 0)} 个代币
                      </p>
                      {kyberChains.length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs font-medium text-blue-800 mb-1">已加载的网络:</div>
                          <div className="flex flex-wrap gap-1">
                            {kyberChains.slice(0, 5).map((chain) => (
                              <Badge key={chain.chainId} variant="outline" className="text-xs flex items-center gap-1">
                                {chain.logoUrl && (
                                  <img
                                    src={chain.logoUrl || "/placeholder.svg?height=12&width=12"}
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
                            <span className="text-[10px] text-blue-500">点击"加载代币"按钮获取更多代币数据</span>
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
                        {useKyberData && kyberChains.length > 0
                          ? kyberChains.map((chain) => (
                              <SelectItem
                                key={chain.chainId}
                                value={chain.displayName.toUpperCase().replace(/\s+/g, "_")}
                              >
                                <div className="flex items-center gap-2">
                                  {chain.logoUrl && (
                                    <img
                                      src={chain.logoUrl || "/placeholder.svg?height=16&width=16"}
                                      alt={chain.displayName}
                                      className="w-4 h-4 rounded-full"
                                    />
                                  )}
                                  {chain.displayName}
                                </div>
                              </SelectItem>
                            ))
                          : chainNames.map((chain) => (
                              <SelectItem key={chain} value={chain}>
                                {chain}
                              </SelectItem>
                            ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>源代币</Label>
                    <TokenSelector
                      value={formData.sourceToken || ""}
                      onValueChange={(value) => handleSelectChange("sourceToken", value)}
                      tokens={filteredSourceTokens}
                      placeholder="选择源代币"
                      open={sourceTokenOpen}
                      onOpenChange={setSourceTokenOpen}
                      disabled={!formData.sourceChain}
                      searchValue={sourceTokenSearch}
                      onSearchChange={setSourceTokenSearch}
                      onLoadTokens={
                        useKyberData && formData.sourceChain
                          ? () => {
                              const kyberChain = kyberChains.find(
                                (chain) =>
                                  chain.displayName.toUpperCase().replace(/\s+/g, "_") === formData.sourceChain,
                              )
                              if (kyberChain) {
                                loadChainTokens(kyberChain.chainId)
                              }
                            }
                          : undefined
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>目标代币</Label>
                    <TokenSelector
                      value={formData.sourceTargetToken || ""}
                      onValueChange={(value) => handleSelectChange("sourceTargetToken", value)}
                      tokens={filteredSourceTargetTokens}
                      placeholder="选择目标代币"
                      open={sourceTargetTokenOpen}
                      onOpenChange={setSourceTargetTokenOpen}
                      disabled={!formData.sourceChain}
                      searchValue={sourceTargetTokenSearch}
                      onSearchChange={setSourceTargetTokenSearch}
                    />
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
                        {useKyberData && kyberChains.length > 0
                          ? kyberChains.map((chain) => (
                              <SelectItem
                                key={chain.chainId}
                                value={chain.displayName.toUpperCase().replace(/\s+/g, "_")}
                              >
                                <div className="flex items-center gap-2">
                                  {chain.logoUrl && (
                                    <img
                                      src={chain.logoUrl || "/placeholder.svg?height=16&width=16"}
                                      alt={chain.displayName}
                                      className="w-4 h-4 rounded-full"
                                    />
                                  )}
                                  {chain.displayName}
                                </div>
                              </SelectItem>
                            ))
                          : chainNames.map((chain) => (
                              <SelectItem key={chain} value={chain}>
                                {chain}
                              </SelectItem>
                            ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>目标代币</Label>
                    <TokenSelector
                      value={formData.targetToken || ""}
                      onValueChange={(value) => handleSelectChange("targetToken", value)}
                      tokens={filteredTargetTokens}
                      placeholder="选择目标代币"
                      open={targetTokenOpen}
                      onOpenChange={setTargetTokenOpen}
                      disabled={!formData.targetChain}
                      searchValue={targetTokenSearch}
                      onSearchChange={setTargetTokenSearch}
                      onLoadTokens={
                        useKyberData && formData.targetChain
                          ? () => {
                              const kyberChain = kyberChains.find(
                                (chain) =>
                                  chain.displayName.toUpperCase().replace(/\s+/g, "_") === formData.targetChain,
                              )
                              if (kyberChain) {
                                loadChainTokens(kyberChain.chainId)
                              }
                            }
                          : undefined
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>源代币</Label>
                    <TokenSelector
                      value={formData.targetSourceToken || ""}
                      onValueChange={(value) => handleSelectChange("targetSourceToken", value)}
                      tokens={filteredTargetSourceTokens}
                      placeholder="选择源代币"
                      open={targetSourceTokenOpen}
                      onOpenChange={setTargetSourceTokenOpen}
                      disabled={!formData.targetChain}
                      searchValue={targetSourceTokenSearch}
                      onSearchChange={setTargetSourceTokenSearch}
                    />
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
        </TabsContent>

        <TabsContent value="wallet" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>钱包设置</CardTitle>
              <CardDescription>配置自动交易所需的钱包信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoTrading">自动交易</Label>
                  <Switch
                    id="autoTrading"
                    checked={formData.autoTrading}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, autoTrading: checked }))}
                  />
                </div>
                <p className="text-sm text-gray-500">启用后，系统将根据策略自动执行交易</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="walletAddress">钱包地址</Label>
                <div className="flex space-x-2">
                  <Input
                    id="walletAddress"
                    name="walletAddress"
                    placeholder="输入钱包地址"
                    value={formData.walletAddress || ""}
                    onChange={handleInputChange}
                    disabled={!formData.autoTrading}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    type="button"
                    disabled={!formData.autoTrading}
                    onClick={handleConnectWallet}
                  >
                    <Wallet className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gasLimit">Gas限制</Label>
                <Input
                  id="gasLimit"
                  name="gasLimit"
                  type="number"
                  placeholder="Gas限制 (例如: 300000)"
                  value={formData.gasLimit || ""}
                  onChange={handleInputChange}
                  disabled={!formData.autoTrading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxPriceImpact">最大价格影响 (%)</Label>
                <Input
                  id="maxPriceImpact"
                  name="maxPriceImpact"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="最大可接受的价格影响百分比"
                  value={formData.maxPriceImpact || ""}
                  onChange={handleInputChange}
                  disabled={!formData.autoTrading}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>API设置</CardTitle>
              <CardDescription>配置使用的去中心化交易所API</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>首选API提供商</Label>
                <Select 
                  onValueChange={(value) => handleSelectChange("preferredApiProvider", value)}
                  value={formData.preferredApiProvider || "PARASWAP"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择首选API提供商" />
                  </SelectTrigger>
                  <SelectContent>
                    {apiProviderOptions.map((provider) => (
                      <SelectItem key={provider.value} value={provider.value}>
                        <div className="flex items-center gap-2">
                          {getApiProviderIcon(provider.value)}
                          {provider.value}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>备用API提供商</Label>
                <Select 
                  onValueChange={(value) => {
                    const currentProviders = formData.fallbackApiProviders || [];
                    if (!currentProviders.includes(value)) {
                      handleFallbackProvidersChange([...currentProviders, value]);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择备用API提供商" />
                  </SelectTrigger>
                  <SelectContent>
                    {apiProviderOptions.map((provider) => (
                      <SelectItem key={provider.value} value={provider.value}>
                        <div className="flex items-center gap-2">
                          {getApiProviderIcon(provider.value)}
                          {provider.value}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* 显示已选择的备用API提供商 */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {(formData.fallbackApiProviders || []).map((provider) => (
                    <Badge key={provider} variant="secondary" className="flex items-center gap-1">
                      {getApiProviderIcon(provider)}
                      {provider}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 ml-1"
                        onClick={() => {
                          const updatedProviders = formData.fallbackApiProviders.filter(p => p !== provider);
                          handleFallbackProvidersChange(updatedProviders);
                        }}
                      >
                        ×
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="useKyberData">使用KyberSwap数据</Label>
                  <Switch
                    id="useKyberData"
                    checked={useKyberData}
                    onCheckedChange={setUseKyberData}
                  />
                </div>
                <p className="text-sm text-gray-500">使用KyberSwap提供的数据进行代币查询</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>高级设置</CardTitle>
              <CardDescription>配置策略的高级参数</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="slippage">滑点容忍度 (%)</Label>
                <Input
                  id="slippage"
                  name="slippage"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="输入可接受的滑点百分比"
                  value={formData.slippage || ""}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minProfitUsd">最小利润 (USD)</Label>
                <Input
                  id="minProfitUsd"
                  name="minProfitUsd"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="最小可接受利润（美元）"
                  value={formData.minProfitUsd || ""}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minProfitPercent">最小利润率 (%)</Label>
                <Input
                  id="minProfitPercent"
                  name="minProfitPercent"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="最小可接受利润率百分比"
                  value={formData.minProfitPercent || ""}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="active">策略状态</Label>
                  <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, active: checked }))}
                  />
                </div>
                <p className="text-sm text-gray-500">启用后，系统将监控并执行此策略</p>
              </div>

              <div className="space-y-2">
                <Label>优先级</Label>
                <Select 
                  onValueChange={(value) => handleSelectChange("priority", value)}
                  value={formData.priority || "MEDIUM"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择策略优先级" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HIGH">高</SelectItem>
                    <SelectItem value="MEDIUM">中</SelectItem>
                    <SelectItem value="LOW">低</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-4 mt-6">
        <Button variant="outline" onClick={() => router.push('/strategies')}>
          取消
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          保存策略
        </Button>
      </div>

      <TokenLoadingIndicator />
    </div>
  )
}
