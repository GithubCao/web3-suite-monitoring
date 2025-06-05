import type { ChainConfig, TokenConfig, TokenDetail } from "./types"

// 基础链ID映射（仅保留最常用的几个）
export const ChainIdMap: ChainConfig = {
  ETHEREUM: 1,
  OPTIMISM: 10,
  BSC: 56,
  BASE: 8453,
  ARBITRUM: 42161,
}

// 基础代币地址映射（保留原有代币信息）
export const tokensByChain: TokenConfig = {
  ARBITRUM: {
    USDC: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
    SQD: "0x1337420dED5ADb9980CFc35f8f2B054ea86f8aB1",
    SFUND: "0x560363BdA52BC6A44CA6C8c9B4a5FadbDa32fa60",
    KIP: "0xF63b14F5eE5574e3F337b2796Bbdf6dcfB4E2CB7",
    STAR: "0xB299751B088336E165dA313c33e3195B8c6663A6",
  },
  BASE: {
    USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    SQD: "0xd4554BEa546EFa83C1E6B389ecac40EA999B3E78",
    OX: "0xba0Dda8762C24dA9487f5FA026a9B64b695A07Ea",
    RWA: "0xE2B1dc2D4A3b4E59FDF0c47B71A7A86391a8B35a",
  },
  ETHEREUM: {
    USDT: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    USDC: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    ETH: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    VOW: "0x1BBf25e71EC48B84d773809B4bA55B6F4bE946Fb",
    OX: "0xba0Dda8762C24dA9487f5FA026a9B64b695A07Ea",
    WCT: "0xeF4461891DfB3AC8572cCf7C794664A8DD927945",
    KIP: "0x946fb08103b400d1c79e07acCCDEf5cfd26cd374",
    STAR: "0xB299751B088336E165dA313c33e3195B8c6663A6",
  },
  BSC: {
    USDC: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    VOW: "0xF585B5b4f22816BAf7629AEA55B701662630397b",
    SFUND: "0x477bC8d23c634C154061869478bce96BE6045D12",
    RWA: "0xE2B1dc2D4A3b4E59FDF0c47B71A7A86391a8B35a",
  },
  OPTIMISM: {
    WCT: "0xeF4461891DfB3AC8572cCf7C794664A8DD927945",
  },
}

// 缓存KyberSwap链信息
let kyberSwapChains: KyberSwapChain[] = []

// 缓存所有链的代币信息
let allTokensCache: Record<string, TokenDetail[]> = {}

// 是否正在初始化
let isInitializing = false

// 应用配置
export interface AppConfig {
  autoLoadTokens: boolean // 是否自动加载代币信息
  preferredChains: string[] // 优先加载的链ID
  cacheExpiry: number // 缓存过期时间（毫秒）
  maxConcurrentRequests: number // 最大并发请求数
}

// 默认应用配置
export const defaultAppConfig: AppConfig = {
  autoLoadTokens: true,
  preferredChains: ["1", "56", "42161", "10", "8453"], // 以太坊, BSC, Arbitrum, Optimism, Base
  cacheExpiry: 24 * 60 * 60 * 1000, // 24小时
  maxConcurrentRequests: 3,
}

// 当前应用配置
let appConfig: AppConfig = { ...defaultAppConfig }

// 动态配置变量 - 使用缓存避免重复加载
let dynamicChainIdMap: ChainConfig | null = null
let dynamicTokensByChain: TokenConfig | null = null

// 获取动态配置（带缓存）
const getDynamicConfig = (): { chains: ChainConfig; tokens: TokenConfig } => {
  if (dynamicChainIdMap === null || dynamicTokensByChain === null) {
    console.log("初始化动态配置...")

    // 初始化为默认值
    dynamicChainIdMap = { ...ChainIdMap } as ChainConfig
    dynamicTokensByChain = { ...tokensByChain } as TokenConfig

    // 尝试加载保存的配置
    if (typeof window !== "undefined") {
      try {
        // 加载应用配置
        const savedAppConfig = localStorage.getItem("web3-arbitrage-app-config")
        if (savedAppConfig) {
          try {
            appConfig = { ...defaultAppConfig, ...JSON.parse(savedAppConfig) }
            console.log("已加载应用配置", appConfig)
          } catch (error) {
            console.error("Error parsing app config:", error)
          }
        }

        const savedConfig = localStorage.getItem("web3-arbitrage-config")
        if (savedConfig) {
          const config = JSON.parse(savedConfig)
          if (config.chains) {
            dynamicChainIdMap = { ...ChainIdMap, ...config.chains } as ChainConfig
            console.log("已加载保存的链配置", Object.keys(dynamicChainIdMap).length)
          }
          if (config.tokens) {
            dynamicTokensByChain = { ...tokensByChain, ...config.tokens } as TokenConfig
            console.log("已加载保存的代币配置", Object.keys(dynamicTokensByChain).length)
          }
        }

        // 尝试加载KyberSwap链信息
        const savedKyberChains = localStorage.getItem("kyberswap-chains")
        if (savedKyberChains) {
          try {
            kyberSwapChains = JSON.parse(savedKyberChains)
            console.log(`已加载KyberSwap链信息: ${kyberSwapChains.length}个链`)

            // 将KyberSwap链信息合并到动态链ID映射中
            kyberSwapChains.forEach((chain) => {
              const chainName = chain.displayName.toUpperCase().replace(/\s+/g, "_")
              dynamicChainIdMap![chainName] = Number(chain.chainId)
            })
          } catch (error) {
            console.error("Error parsing saved KyberSwap chains:", error)
          }
        }

        // 尝试加载缓存的代币信息
        const savedTokensCache = localStorage.getItem("kyberswap-tokens-cache")
        if (savedTokensCache) {
          try {
            const parsedCache = JSON.parse(savedTokensCache)
            const cacheTimestamp = parsedCache.timestamp || 0
            const currentTime = Date.now()

            // 检查缓存是否过期
            if (currentTime - cacheTimestamp < appConfig.cacheExpiry) {
              allTokensCache = parsedCache.tokens || {}
              console.log(`已加载代币缓存: ${Object.keys(allTokensCache).length}个链`)

              // 将缓存的代币信息合并到动态代币配置中
              Object.entries(allTokensCache).forEach(([chainIdStr, tokens]) => {
                // 查找对应的链名称
                const chainId = Number(chainIdStr)
                let chainName = ""

                // 首先从KyberSwap链中查找
                const kyberChain = kyberSwapChains.find((c) => Number(c.chainId) === chainId)
                if (kyberChain) {
                  chainName = kyberChain.displayName.toUpperCase().replace(/\s+/g, "_")
                } else {
                  // 从配置中查找
                  for (const [name, id] of Object.entries(dynamicChainIdMap as ChainConfig)) {
                    if (id === chainId) {
                      chainName = name
                      break
                    }
                  }
                }

                if (chainName) {
                  // 如果找到了链名称，更新动态代币配置
                  if (!dynamicTokensByChain![chainName]) {
                    dynamicTokensByChain![chainName] = {}
                  }

                  tokens.forEach((token) => {
                    dynamicTokensByChain![chainName][token.symbol] = token
                  })

                  console.log(`已合并${tokens.length}个缓存代币到链${chainName}`)
                }
              })
            } else {
              console.log("代币缓存已过期，将重新加载")
            }
          } catch (error) {
            console.error("Error parsing saved tokens cache:", error)
          }
        }
      } catch (error) {
        console.error("Error loading saved config:", error)
      }
    }
  }

  return {
    chains: dynamicChainIdMap as ChainConfig,
    tokens: dynamicTokensByChain as TokenConfig,
  }
}

// 重置缓存（当配置更新时调用）
export const resetConfigCache = (): void => {
  dynamicChainIdMap = null
  dynamicTokensByChain = null
}

// 保存应用配置
export const saveAppConfig = (config: Partial<AppConfig>): void => {
  appConfig = { ...appConfig, ...config }

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("web3-arbitrage-app-config", JSON.stringify(appConfig))
    } catch (error) {
      console.error("Error saving app config:", error)
    }
  }
}

// 获取应用配置
export const getAppConfig = (): AppConfig => {
  return { ...appConfig }
}

// 获取链名称列表
export const getChainNames = (): string[] => {
  const { chains } = getDynamicConfig()
  return Object.keys(chains)
}

// 获取特定链上的代币列表
export const getTokensForChain = (chain: string): string[] => {
  const { tokens } = getDynamicConfig()
  if (!tokens[chain]) return []
  return Object.keys(tokens[chain])
}

// 获取代币地址
export const getTokenAddress = (chain: string, token: string): string => {
  console.log(`获取代币地址: chain=${chain}, token=${token}`)

  // 首先尝试从KyberSwap缓存中获取
  const chainId = getChainId(chain)
  if (chainId) {
    const cachedToken = getCachedTokenBySymbol(chainId, token)
    if (cachedToken) {
      console.log(`从KyberSwap缓存获取到代币地址: ${cachedToken.address}`)
      return cachedToken.address
    }
  }

  // 回退到配置
  const { tokens } = getDynamicConfig()
  if (!tokens[chain] || !tokens[chain][token]) {
    console.log(`在配置中找不到代币 ${token} 的地址`)
    return ""
  }

  const tokenData = tokens[chain][token]
  if (typeof tokenData === "string") {
    console.log(`从配置获取到代币地址: ${tokenData}`)
    return tokenData
  } else {
    console.log(`从配置获取到代币地址: ${tokenData.address}`)
    return tokenData.address
  }
}

// 获取链ID
export const getChainId = (chain: string): number => {
  console.log(`获取链ID: chain=${chain}`)

  if (!chain) {
    console.warn("传入的链名称为空")
    return 0
  }

  // 首先检查是否是KyberSwap链名称
  const kyberChain = kyberSwapChains.find(
    (c) => c.displayName.toUpperCase().replace(/\s+/g, "_") === chain || c.chainName.toUpperCase() === chain,
  )

  if (kyberChain) {
    const chainId = Number(kyberChain.chainId)
    console.log(`从KyberSwap链信息获取到链ID: ${chainId}`)
    return chainId
  }

  // 回退到本地配置
  const { chains } = getDynamicConfig()
  const chainId = chains[chain] || 0

  if (chainId) {
    console.log(`从本地配置获取到链ID: ${chainId}`)
  } else {
    console.warn(`找不到链 ${chain} 的ID`)
  }

  return chainId
}

// 获取链的简短名称
export const getChainShortName = (chainId: number): string => {
  const networkInfo = getNetworkInfo(chainId)
  return networkInfo ? networkInfo.shortName : ""
}

// 获取链的完整名称
export const getChainFullName = (chainId: number): string => {
  const networkInfo = getNetworkInfo(chainId)
  return networkInfo ? networkInfo.name : ""
}

// 获取链的原生代币信息
export const getNativeCurrency = (chainId: number): { name: string; symbol: string; decimals: number } | null => {
  const networkInfo = getNetworkInfo(chainId)
  return networkInfo ? networkInfo.nativeCurrency : null
}

// 获取链的区块浏览器URL
export const getExplorerUrl = (chainId: number): string => {
  const networkInfo = getNetworkInfo(chainId)
  if (networkInfo && networkInfo.explorers && networkInfo.explorers.length > 0) {
    return networkInfo.explorers[0].url
  }
  return ""
}

// 从networkDict中获取网络信息
const getNetworkInfo = (chainId: number): any => {
  return {
    name: getChainNameByChainId(chainId),
    shortName: getChainShortNameByChainId(chainId),
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    explorers: [
      {
        name: "Explorer",
        url: `https://example.com/${chainId}`,
      },
    ],
  }
}

// 通过chainId获取链名称
const getChainNameByChainId = (chainId: number): string => {
  for (const [name, id] of Object.entries(ChainIdMap)) {
    if (id === chainId) {
      return name
    }
  }
  return "Unknown Chain"
}

// 通过chainId获取链简称
const getChainShortNameByChainId = (chainId: number): string => {
  const shortNameMap: Record<number, string> = {
    1: "eth",
    137: "pol",
    56: "bnb",
    42161: "arb",
    10: "op",
    8453: "base",
    43114: "avax",
    324: "zksync",
    59144: "linea",
    534352: "scroll",
  }

  return shortNameMap[chainId] || "unknown"
}

// 获取所有支持的代币符号
export const getAllTokenSymbols = (): string[] => {
  const symbols = new Set<string>()

  Object.values(tokensByChain).forEach((tokens) => {
    Object.keys(tokens).forEach((symbol) => {
      symbols.add(symbol)
    })
  })

  return Array.from(symbols)
}

// 获取特定代币在所有链上的地址
export const getTokenAddressesAcrossChains = (tokenSymbol: string): Record<string, string> => {
  const addresses: Record<string, string> = {}

  Object.entries(tokensByChain).forEach(([chain, tokens]) => {
    const tokenValue = tokens[tokenSymbol]
    if (tokenValue) {
      if (typeof tokenValue === "string") {
        addresses[chain] = tokenValue
      } else {
        addresses[chain] = tokenValue.address
      }
    }
  })

  return addresses
}

// 检查两条链是否都支持特定代币
export const checkTokenSupportedOnBothChains = (
  sourceChain: string,
  targetChain: string,
  tokenSymbol: string,
): boolean => {
  const { tokens } = getDynamicConfig()
  return !!(
    tokens[sourceChain] &&
    tokens[targetChain] &&
    tokens[sourceChain][tokenSymbol] &&
    tokens[targetChain][tokenSymbol]
  )
}

// 获取两条链共同支持的代币
export const getCommonTokens = (chain1: string, chain2: string): string[] => {
  const { tokens } = getDynamicConfig()
  if (!tokens[chain1] || !tokens[chain2]) return []

  const tokens1 = new Set(Object.keys(tokens[chain1]))
  const tokens2 = new Set(Object.keys(tokens[chain2]))

  return Array.from(tokens1).filter((token) => tokens2.has(token))
}

// 获取代币小数位数
export const getTokenDecimals = (chain: string, token: string): number => {
  console.log(`获取代币小数位数: chain=${chain}, token=${token}`)

  // 首先尝试从缓存中获取
  const chainId = getChainId(chain)
  if (chainId) {
    const cachedToken = getCachedTokenBySymbol(chainId, token)
    if (cachedToken) {
      console.log(`从KyberSwap缓存获取到代币小数位数: ${cachedToken.decimals}`)
      return cachedToken.decimals
    }
  }

  // 回退到配置
  const { tokens } = getDynamicConfig()
  if (!tokens[chain] || !tokens[chain][token]) {
    console.log(`在配置中找不到代币 ${token}，使用默认值18`)
    return 18 // 默认18位小数
  }

  const tokenData = tokens[chain][token]
  if (typeof tokenData === "string") {
    // 默认值
    if (token === "USDC" || token === "USDT") {
      console.log(`${token}使用默认小数位数: 6`)
      return 6
    }
    console.log(`${token}使用默认小数位数: 18`)
    return 18
  } else {
    console.log(`从配置获取到代币小数位数: ${tokenData.decimals}`)
    return tokenData.decimals
  }
}

// 从KyberSwap API获取代币数据
export const fetchTokensFromKyberSwap = async (chainId: number): Promise<TokenDetail[]> => {
  try {
    // 检查缓存中是否已有数据
    const chainIdStr = chainId.toString()
    if (allTokensCache[chainIdStr] && allTokensCache[chainIdStr].length > 0) {
      console.log(`Using cached tokens for chain ${chainId}: ${allTokensCache[chainIdStr].length} tokens`)
      return allTokensCache[chainIdStr]
    }

    let allTokens: TokenDetail[] = []
    let page = 1
    let hasMorePages = true
    const pageSize = 100 // KyberSwap API每页最多100个代币

    while (hasMorePages) {
      const url = `https://ks-setting.kyberswap.com/api/v1/tokens?page=${page}&pageSize=${pageSize}&isWhitelisted=true&chainIds=${chainId}`
      console.log(`Fetching tokens page ${page} for chain ${chainId}...`)

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Failed to fetch tokens: ${response.status}`)
      }

      const data = await response.json()

      if (!data.data || !Array.isArray(data.data.tokens)) {
        throw new Error("Invalid response format")
      }

      const tokens = data.data.tokens.map((token: any) => ({
        chainId: token.chainId,
        address: token.address,
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        logoURI: token.logoURI || "",
      }))

      allTokens = [...allTokens, ...tokens]

      // 检查是否有更多页
      if (data.data.pagination && data.data.pagination.totalItems > page * pageSize) {
        page++
      } else {
        hasMorePages = false
      }
    }

    console.log(`Total tokens fetched for chain ${chainId}: ${allTokens.length}`)

    // 更新缓存
    allTokensCache[chainIdStr] = allTokens

    // 保存到本地存储
    if (typeof window !== "undefined") {
      const cacheData = {
        timestamp: Date.now(),
        tokens: allTokensCache,
      }
      localStorage.setItem("kyberswap-tokens-cache", JSON.stringify(cacheData))
    }

    return allTokens
  } catch (error) {
    console.error("Error fetching tokens from KyberSwap:", error)
    return []
  }
}

// 初始化代币缓存（获取所有链的代币）
export const initializeTokensCache = async (): Promise<void> => {
  if (isInitializing) {
    console.log("Token initialization already in progress")
    return
  }

  try {
    isInitializing = true
    console.log("Starting token cache initialization")

    // 确保我们有链信息
    if (kyberSwapChains.length === 0) {
      await fetchKyberSwapChains()
    }

    if (kyberSwapChains.length === 0) {
      throw new Error("Failed to fetch chain information")
    }

    // 获取应用配置
    const config = getAppConfig()

    // 按照优先级排序链
    const sortedChains = [...kyberSwapChains].sort((a, b) => {
      const aIndex = config.preferredChains.indexOf(a.chainId)
      const bIndex = config.preferredChains.indexOf(b.chainId)

      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
      if (aIndex !== -1) return -1
      if (bIndex !== -1) return 1
      return 0
    })

    console.log(
      `Fetching tokens for ${sortedChains.length} chains with max concurrency ${config.maxConcurrentRequests}`,
    )

    // 使用批处理方式获取代币，避免同时发送太多请求
    for (let i = 0; i < sortedChains.length; i += config.maxConcurrentRequests) {
      const batch = sortedChains.slice(i, i + config.maxConcurrentRequests)

      await Promise.all(
        batch.map(async (chain) => {
          try {
            console.log(`Fetching tokens for chain ${chain.displayName} (${chain.chainId})`)
            const tokens = await fetchTokensFromKyberSwap(Number(chain.chainId))
            console.log(`Fetched ${tokens.length} tokens for chain ${chain.displayName}`)
          } catch (error) {
            console.error(`Error fetching tokens for chain ${chain.chainId}:`, error)
          }
        }),
      )
    }

    console.log("Token cache initialization completed")
  } catch (error) {
    console.error("Error initializing token cache:", error)
  } finally {
    isInitializing = false
  }
}

// 获取缓存中的代币
export const getCachedTokensForChain = (chainId: number | string): TokenDetail[] => {
  const chainIdStr = chainId.toString()
  return allTokensCache[chainIdStr] || []
}

// 获取缓存中的代币（按符号查找）
export const getCachedTokenBySymbol = (chainId: number | string, symbol: string): TokenDetail | null => {
  const tokens = getCachedTokensForChain(chainId)
  return tokens.find((token) => token.symbol.toUpperCase() === symbol.toUpperCase()) || null
}

// 获取缓存中的代币（按地址查找）
export const getCachedTokenByAddress = (chainId: number | string, address: string): TokenDetail | null => {
  const tokens = getCachedTokensForChain(chainId)
  return tokens.find((token) => token.address.toLowerCase() === address.toLowerCase()) || null
}

// 更新代币配置
export const updateTokensForChain = (chainId: number, tokens: TokenDetail[]): void => {
  const { chains } = getDynamicConfig()

  // 找到对应的链名称
  let chainName = ""
  for (const [name, id] of Object.entries(chains)) {
    if (id === chainId) {
      chainName = name
      break
    }
  }

  if (!chainName) {
    console.error(`Chain ID ${chainId} not found in configuration`)
    return
  }

  // 更新本地代币缓存
  const chainIdStr = chainId.toString()
  allTokensCache[chainIdStr] = tokens

  // 更新代币配置
  const { tokens: currentTokens } = getDynamicConfig()
  const updatedTokens = { ...currentTokens }

  if (!updatedTokens[chainName]) {
    updatedTokens[chainName] = {}
  }

  // 清空现有代币配置，重新添加
  updatedTokens[chainName] = {}

  // 添加或更新代币
  tokens.forEach((token) => {
    updatedTokens[chainName][token.symbol] = token
  })

  // 保存更新后的配置
  if (typeof window !== "undefined") {
    try {
      const config = {
        chains,
        tokens: updatedTokens,
      }
      localStorage.setItem("web3-arbitrage-config", JSON.stringify(config))

      // 同时更新代币缓存
      const cacheData = {
        timestamp: Date.now(),
        tokens: allTokensCache,
      }
      localStorage.setItem("kyberswap-tokens-cache", JSON.stringify(cacheData))

      console.log(`已更新链 ${chainName} 的代币配置，共 ${tokens.length} 个代币`)
    } catch (error) {
      console.error("Error saving updated token config:", error)
    }
  }

  // 重置缓存，强制重新加载
  resetConfigCache()
}

// KyberSwap支持的网络类型
export interface KyberSwapChain {
  chainId: string
  chainName: string
  displayName: string
  logoUrl: string
}

// 从KyberSwap API获取支持的网络列表
export const fetchKyberSwapChains = async (): Promise<KyberSwapChain[]> => {
  try {
    // 如果已经有缓存的数据，直接返回
    if (kyberSwapChains.length > 0) {
      return kyberSwapChains
    }

    // 使用正确的KyberSwap API端点
    const response = await fetch("https://ks-setting.kyberswap.com/api/v1/configurations/fetch?serviceCode=chains")

    if (!response.ok) {
      throw new Error(`Failed to fetch chains: ${response.status}`)
    }

    const data = await response.json()

    if (data.code !== 0 || !data.data?.config) {
      throw new Error("Invalid response format")
    }

    kyberSwapChains = data.data.config

    // 缓存到本地存储
    if (typeof window !== "undefined") {
      localStorage.setItem("kyberswap-chains", JSON.stringify(kyberSwapChains))

      // 更新动态链ID映射
      const { chains } = getDynamicConfig()
      const updatedChains = { ...chains }

      kyberSwapChains.forEach((chain) => {
        const chainName = chain.displayName.toUpperCase().replace(/\s+/g, "_")
        updatedChains[chainName] = Number(chain.chainId)
      })

      // 保存更新后的配置
      const { tokens } = getDynamicConfig()
      const config = {
        chains: updatedChains,
        tokens,
      }
      localStorage.setItem("web3-arbitrage-config", JSON.stringify(config))

      // 重置缓存
      resetConfigCache()

      // 如果配置了自动加载代币，则开始加载
      const currentAppConfig = getAppConfig()
      if (currentAppConfig.autoLoadTokens && !isInitializing) {
        initializeTokensCache()
      }
    }

    return kyberSwapChains
  } catch (error) {
    console.error("Error fetching chains from KyberSwap:", error)
    return []
  }
}

// 获取当前动态配置
export const getCurrentConfig = (): {
  chains: ChainConfig
  tokens: TokenConfig
} => {
  return getDynamicConfig()
}

// 自动初始化
if (typeof window !== "undefined") {
  // 延迟初始化，避免阻塞页面加载
  setTimeout(() => {
    fetchKyberSwapChains().catch(console.error)
  }, 1000)
}

// 调试函数：获取KyberSwap缓存状态
export const getKyberSwapCacheStatus = (): {
  chains: KyberSwapChain[]
  tokens: {
    chainId: string
    count: number
    sampleTokens: string[]
  }[]
} => {
  // 获取缓存中的代币样本
  const tokenSamples = Object.entries(allTokensCache).map(([chainId, tokens]) => {
    return {
      chainId,
      count: tokens.length,
      sampleTokens: tokens.slice(0, 5).map((t) => t.symbol),
    }
  })

  return {
    chains: kyberSwapChains,
    tokens: tokenSamples,
  }
}

// 调试函数：获取特定链上的所有代币
export const getDebugTokensForChain = (
  chainIdOrName: string | number,
): {
  chainId: string | number
  tokenCount: number
  tokens: TokenDetail[]
} => {
  let chainId: string | number = chainIdOrName

  // 如果传入的是链名称，则转换为链ID
  if (typeof chainIdOrName === "string" && isNaN(Number(chainIdOrName))) {
    const id = getChainId(chainIdOrName)
    if (id) {
      chainId = id
    }
  }

  // 获取缓存中的代币
  const chainIdStr = chainId.toString()
  const tokens = allTokensCache[chainIdStr] || []

  return {
    chainId,
    tokenCount: tokens.length,
    tokens,
  }
}

// 强制刷新KyberSwap缓存
export const forceRefreshKyberSwapCache = async (): Promise<boolean> => {
  try {
    console.log("开始强制刷新KyberSwap缓存...")

    // 清除现有缓存
    kyberSwapChains = []
    allTokensCache = {}

    // 重置配置缓存
    resetConfigCache()

    // 重新获取链信息
    const chains = await fetchKyberSwapChains()
    if (chains.length === 0) {
      console.error("无法获取KyberSwap链信息")
      return false
    }

    console.log(`已获取${chains.length}个KyberSwap链`)

    // 获取应用配置
    const config = getAppConfig()

    // 只加载优先链的代币数据
    const priorityChains = chains.filter((chain) => config.preferredChains.includes(chain.chainId))

    if (priorityChains.length === 0) {
      console.warn("没有找到优先加载的链")
      return false
    }

    console.log(`开始加载${priorityChains.length}个优先链的代币数据`)

    // 逐个加载代币数据
    for (const chain of priorityChains) {
      try {
        console.log(`加载链${chain.displayName} (${chain.chainId})的代币数据...`)
        const tokens = await fetchTokensFromKyberSwap(Number(chain.chainId))
        console.log(`已加载${tokens.length}个代币`)
      } catch (error) {
        console.error(`加载链${chain.chainId}的代币数据失败:`, error)
      }
    }

    // 重新初始化配置
    resetConfigCache()
    getDynamicConfig()

    console.log("KyberSwap缓存刷新完成")
    return true
  } catch (error) {
    console.error("刷新KyberSwap缓存失败:", error)
    return false
  }
}

// 强制刷新配置缓存（用于代币管理页面更新后）
export const forceRefreshConfig = (): void => {
  console.log("强制刷新配置缓存...")

  // 重置所有缓存
  dynamicChainIdMap = null
  dynamicTokensByChain = null

  // 重新加载配置
  getDynamicConfig()

  console.log("配置缓存已刷新")
}

// 获取特定链的代币数量（用于调试）
export const getTokenCountForChain = (chainName: string): number => {
  const { tokens } = getDynamicConfig()
  return tokens[chainName] ? Object.keys(tokens[chainName]).length : 0
}
