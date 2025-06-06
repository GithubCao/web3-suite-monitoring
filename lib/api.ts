import { getChainId, getTokenAddress, getCachedTokenByAddress } from "./config"
import { getApiConfig, getApiConfigsForChain } from "./api-config"
import type { PriceQuote, RouteStep, TradeExecution, ApiConfig } from "./types"
import { addTradeExecution, updateTradeExecution } from "./storage"

// 代币小数位数缓存
const tokenDecimalsCache: Record<string, number> = {}

// API提供商枚举
export enum ApiProvider {
  ONEINCH = "1inch",
  SUSHI = "sushi",
  UNISWAP = "uniswap",
  PARASWAP = "paraswap",
  ZEROX = "0x",
  KYBERSWAP = "kyberswap",
  JUPITER = "jupiter",
}

// 1inch API响应类型
interface OneInchQuoteResponse {
  quoteId: string | null
  fromTokenAmount: string
  toTokenAmount: string
  feeToken: string
  presets: {
    fast: OneInchPreset
    medium: OneInchPreset
    slow: OneInchPreset
  }
  fee: {
    receiver: string
    bps: number
    whitelistDiscountPercent: number
  }
  integratorFee: number
  settlementAddress: string
  whitelist: string[]
  recommended_preset: string
  prices: {
    usd: {
      fromToken: string
      toToken: string
    }
  }
  volume: {
    usd: {
      fromToken: string
      toToken: string
    }
  }
  suggested: boolean
  priceImpactPercent: number
  autoK: number
  k: number
  mxK: number
  gas: number
  pfGas: number
  marketAmount: string
}

interface OneInchPreset {
  auctionDuration: number
  startAuctionIn: number
  bankFee: string
  initialRateBump: number
  auctionStartAmount: string
  auctionEndAmount: string
  tokenFee: string
  exclusiveResolver: string | null
  estP: number
  allowPartialFills: boolean
  allowMultipleFills: boolean
  gasCost: {
    gasBumpEstimate: number
    gasPriceEstimate: string
  }
  points: Array<{
    delay: number
    coefficient: number
  }>
  startAmount: string
}

// KyberSwap API响应类型
interface KyberSwapRouteResponse {
  code: number
  message: string
  data: {
    routeSummary: {
      tokenIn: string
      amountIn: string
      amountInUsd: string
      tokenOut: string
      amountOut: string
      amountOutUsd: string
      gas: string
      gasPrice: string
      gasUsd: string
      l1FeeUsd: string
      extraFee: {
        feeAmount: string
        chargeFeeBy: string
        isInBps: boolean
        feeReceiver: string
      }
      route: Array<
        Array<{
          pool: string
          tokenIn: string
          tokenOut: string
          swapAmount: string
          amountOut: string
          exchange: string
          poolType: string
          poolExtra: {
            blockNumber: number
            priceLimit: number | string
          }
          extra: {
            ri?: string
            nSqrtRx96?: string
          }
        }>
      >
      routeID: string
      checksum: string
      timestamp: number
    }
    routerAddress: string
  }
  requestId: string
}

// KyberSwap价格影响API响应类型
interface KyberSwapPriceImpactResponse {
  code: number
  message: string
  data: {
    amountInUSD: string
    amountOutUSD: string
    priceImpact: string
  }
}

// Jupiter API响应类型
interface JupiterQuoteResponse {
  inputMint: string
  inAmount: string
  outputMint: string
  outAmount: string
  otherAmountThreshold: string
  swapMode: string
  slippageBps: number
  platformFee: null | {
    amount: string
    feeBps: number
  }
  priceImpactPct: string
  routePlan: Array<{
    swapInfo: {
      ammKey: string
      label: string
      inputMint: string
      outputMint: string
      inAmount: string
      outAmount: string
      feeAmount: string
      feeMint: string
    }
    percent: number
  }>
  contextSlot: number
  timeTaken: number
}

// 获取1inch价格报价
const fetch1InchQuote = async (
  apiConfig: ApiConfig,
  chainId: number,
  tokenInAddress: string,
  tokenOutAddress: string,
  amount: string,
): Promise<PriceQuote | null> => {
  try {
    const walletAddress = "0x0000000000000000000000000000000000000000"
    const url = `${apiConfig.config.baseUrl}/${chainId}/quote/receive?walletAddress=${walletAddress}&fromTokenAddress=${tokenInAddress}&toTokenAddress=${tokenOutAddress}&amount=${amount}&enableEstimate=false&source=0xe26b9977&showDestAmountMinusFee=true`

    console.log(`Fetching 1inch quote from: ${url}`)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), apiConfig.config.timeout || 10000)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(apiConfig.config.apiKey && {
          Authorization: `Bearer ${apiConfig.config.apiKey}`,
        }),
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`1inch API error: ${response.status}`)
    }

    const data: OneInchQuoteResponse = await response.json()

    // 计算交换价格
    const amountIn = Number.parseFloat(data.fromTokenAmount)
    const amountOut = Number.parseFloat(data.toTokenAmount)
    const swapPrice = amountOut / amountIn

    // 转换为统一格式
    const quote: PriceQuote = {
      status: "success",
      tokens: [
        {
          address: tokenInAddress,
          symbol: "IN",
          name: "Input Token",
          decimals: 18,
        },
        {
          address: tokenOutAddress,
          symbol: "OUT",
          name: "Output Token",
          decimals: 18,
        },
      ],
      tokenFrom: 0,
      tokenTo: 1,
      swapPrice,
      priceImpact: data.priceImpactPercent / 100,
      amountIn: data.fromTokenAmount,
      assumedAmountOut: data.toTokenAmount,
      gasSpent: data.gas,
      provider: apiConfig.id,
      route: [
        {
          dexName: "1inch Fusion",
          poolAddress: data.settlementAddress,
          poolFee: data.fee.bps / 10000,
          tokenIn: "IN",
          tokenOut: "OUT",
          amountIn: data.fromTokenAmount,
          amountOut: data.toTokenAmount,
        },
      ],
    }

    return quote
  } catch (error) {
    console.error("Error fetching 1inch quote:", error)
    return null
  }
}

// 获取SushiSwap价格报价
const fetchSushiQuote = async (
  apiConfig: ApiConfig,
  chainId: number,
  tokenInAddress: string,
  tokenOutAddress: string,
  amount: string,
  slippage = "0.005",
): Promise<PriceQuote | null> => {
  try {
    if (!chainId || !tokenInAddress || !tokenOutAddress) {
      console.error("Invalid chain or token configuration")
      return null
    }

    // 使用convertToWei函数将金额转换为Wei
    // const amountInWei = convertToWei(Number.parseFloat(amount), 18);
    const amountInWei = amount
    // 使用 Sushi API 进行价格查询
    const url = `${apiConfig.config.baseUrl}/quote/v7/${chainId}?tokenIn=${tokenInAddress}&tokenOut=${tokenOutAddress}&amount=${amountInWei}&maxSlippage=${slippage}&fee=0.0025&feeBy=output`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`)
    }

    const data = await response.json()

    // 将 Sushi API 响应转换为 PriceQuote 格式
    const quote = {
      status: "success",
      ...data,
      route: null,
      // data.map((step: any) => ({
      //   dexName: step.dex || "Sushi",
      //   poolAddress: step.poolAddress || "",
      //   poolFee: step.fee || 0.0025,
      //   // tokenIn: tokenInSymbol,
      //   // tokenOut: tokenOutSymbol,
      //   amountIn: amount,
      //   amountOut: (
      //     Number(data.amountOut) /
      //     10 ** (data.tokenOut.decimals || 18)
      //   ).toString(),
      // })),
    } as PriceQuote
    console.log(quote)
    return quote
  } catch (error) {
    console.error("Error fetching price quote:", error)
    return null
  }
}

// 获取Uniswap价格报价
const fetchUniswapQuote = async (
  apiConfig: ApiConfig,
  chainId: number,
  tokenInAddress: string,
  tokenOutAddress: string,
  amount: string,
): Promise<PriceQuote | null> => {
  try {
    console.log(`Fetching Uniswap quote for chain ${chainId}`)

    // 模拟API调用延迟
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 800 + 300))

    // 模拟价格计算
    const basePrice = Math.random() * 100
    const swapPrice = basePrice * (1 + (Math.random() * 0.015 - 0.0075)) // ±0.75% 随机波动

    const data: PriceQuote = {
      status: "success",
      tokens: [
        {
          address: tokenInAddress,
          symbol: "IN",
          name: "Input Token",
          decimals: 18,
        },
        {
          address: tokenOutAddress,
          symbol: "OUT",
          name: "Output Token",
          decimals: 18,
        },
      ],
      tokenFrom: 0,
      tokenTo: 1,
      swapPrice: swapPrice,
      priceImpact: 0.0005 + Math.random() * 0.003,
      amountIn: amount,
      assumedAmountOut: (Number.parseFloat(amount) * swapPrice).toString(),
      gasSpent: 120000 + Math.floor(Math.random() * 40000),
      provider: apiConfig.id,
      route: [
        {
          dexName: "Uniswap V3",
          poolAddress: `0x${Math.random().toString(16).substring(2, 10)}`,
          poolFee: 0.0005,
          tokenIn: "IN",
          tokenOut: "OUT",
          amountIn: amount,
          amountOut: (Number.parseFloat(amount) * swapPrice).toString(),
        },
      ],
    }

    return data
  } catch (error) {
    console.error("Error fetching Uniswap quote:", error)
    return null
  }
}

// 获取ParaSwap价格报价（模拟）
const fetchParaSwapQuote = async (
  apiConfig: ApiConfig,
  chainId: number,
  tokenInAddress: string,
  tokenOutAddress: string,
  amount: string,
): Promise<PriceQuote | null> => {
  try {
    if (!apiConfig.config.apiKey) {
      throw new Error("ParaSwap requires API key")
    }

    console.log(`Fetching ParaSwap quote for chain ${chainId}`)

    // 模拟API调用
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 1200 + 400))

    const basePrice = Math.random() * 100
    const swapPrice = basePrice * (1 + (Math.random() * 0.025 - 0.0125)) // ±1.25% 随机波动

    const data: PriceQuote = {
      status: "success",
      tokens: [
        {
          address: tokenInAddress,
          symbol: "IN",
          name: "Input Token",
          decimals: 18,
        },
        {
          address: tokenOutAddress,
          symbol: "OUT",
          name: "Output Token",
          decimals: 18,
        },
      ],
      tokenFrom: 0,
      tokenTo: 1,
      swapPrice: swapPrice,
      priceImpact: 0.0008 + Math.random() * 0.004,
      amountIn: amount,
      assumedAmountOut: (Number.parseFloat(amount) * swapPrice).toString(),
      gasSpent: 180000 + Math.floor(Math.random() * 60000),
      provider: apiConfig.id,
      route: [
        {
          dexName: "ParaSwap",
          poolAddress: `0x${Math.random().toString(16).substring(2, 10)}`,
          poolFee: 0.002,
          tokenIn: "IN",
          tokenOut: "OUT",
          amountIn: amount,
          amountOut: (Number.parseFloat(amount) * swapPrice).toString(),
        },
      ],
    }

    return data
  } catch (error) {
    console.error("Error fetching ParaSwap quote:", error)
    return null
  }
}

// 获取KyberSwap价格报价
const fetchKyberSwapQuote = async (
  apiConfig: ApiConfig,
  chainId: number,
  tokenInAddress: string,
  tokenOutAddress: string,
  amount: string,
): Promise<PriceQuote | null> => {
  try {
    // 构建KyberSwap API请求URL
    const baseUrl = apiConfig.config.baseUrl || "https://aggregator-api.kyberswap.com"
    const chainName = getChainNameForKyberSwap(chainId)
    if (!chainName) {
      console.error(`KyberSwap does not support chain ID ${chainId}`)
      return null
    }

    // 确保金额不使用科学计数法表示
    let adjustedAmount = amount
    if (adjustedAmount.includes("e")) {
      const amountNum = Number(adjustedAmount)
      adjustedAmount = amountNum.toLocaleString("fullwide", { useGrouping: false })
      console.log(`转换金额从 ${amount} 到 ${adjustedAmount}`)
    }

    const url = `${baseUrl}/${chainName}/api/v1/routes?tokenIn=${tokenInAddress}&tokenOut=${tokenOutAddress}&amountIn=${adjustedAmount}&gasInclude=true&saveGas=false`

    console.log(`Fetching KyberSwap quote from: ${url}`)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), apiConfig.config.timeout || 12000)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; ArbitrageBot/1.0)",
        ...(apiConfig.config.apiKey && {
          Authorization: `Bearer ${apiConfig.config.apiKey}`,
        }),
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`KyberSwap API error: ${response.status} - ${errorText}`)
      throw new Error(`KyberSwap API error: ${response.status}`)
    }

    const data: KyberSwapRouteResponse = await response.json()

    if (data.code !== 0 || !data.data?.routeSummary) {
      console.error(`KyberSwap API error: ${data.message || "Invalid response"}`, data)
      throw new Error(`KyberSwap API error: ${data.message || "Invalid response"}`)
    }

    const routeSummary = data.data.routeSummary

    // 计算交换价格
    const amountIn = Number.parseFloat(routeSummary.amountIn)
    const amountOut = Number.parseFloat(routeSummary.amountOut)

    if (amountIn === 0) {
      throw new Error("Invalid input amount")
    }

    const swapPrice = amountOut / amountIn

    // 获取价格影响数据 - 使用默认值避免额外API调用失败
    const priceImpact = 0.01 // 默认1%

    // 计算预估gas费用
    const gasSpent = routeSummary.gas ? Number.parseInt(routeSummary.gas, 10) : 150000

    // 构建交易路径步骤
    const routeSteps: RouteStep[] = []

    if (routeSummary.route && routeSummary.route.length > 0) {
      // 取第一条路径（通常是最优路径）
      const bestRoute = routeSummary.route[0]

      bestRoute.forEach((step) => {
        routeSteps.push({
          dexName: step.exchange,
          poolAddress: step.pool,
          poolFee: 0.003, // 默认费率
          tokenIn: step.tokenIn,
          tokenOut: step.tokenOut,
          amountIn: step.swapAmount,
          amountOut: step.amountOut,
        })
      })
    }

    // 转换为统一格式
    const quote: PriceQuote = {
      status: "success",
      tokens: [
        {
          address: tokenInAddress,
          symbol: "IN",
          name: "Input Token",
          decimals: 18,
        },
        {
          address: tokenOutAddress,
          symbol: "OUT",
          name: "Output Token",
          decimals: 18,
        },
      ],
      tokenFrom: 0,
      tokenTo: 1,
      swapPrice,
      priceImpact,
      amountIn: routeSummary.amountIn,
      assumedAmountOut: routeSummary.amountOut,
      gasSpent,
      provider: apiConfig.id,
      route: routeSteps,
    }

    console.log(`KyberSwap quote successful: ${swapPrice} (${routeSummary.amountIn} -> ${routeSummary.amountOut})`)
    return quote
  } catch (error) {
    console.error("Error fetching KyberSwap quote:", error)

    // 如果是网络错误或超时，返回null让系统尝试其他提供商
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        console.error("KyberSwap request timed out")
      } else if (error.message.includes("Failed to fetch")) {
        console.error("KyberSwap network error - API may be unavailable")
      }
    }

    return null
  }
}

// 获取KyberSwap价格影响数据
const fetchKyberSwapPriceImpact = async (
  apiConfig: ApiConfig,
  chainId: number,
  tokenInAddress: string,
  tokenOutAddress: string,
  amountIn: string,
  amountOut: string,
  tokenInDecimal = 18,
  tokenOutDecimal = 18,
): Promise<{
  amountInUSD: string
  amountOutUSD: string
  priceImpact: string
} | null> => {
  try {
    const url = `https://bff.kyberswap.com/api/v1/price-impact?tokenIn=${tokenInAddress}&tokenInDecimal=${tokenInDecimal}&tokenOut=${tokenOutAddress}&tokenOutDecimal=${tokenOutDecimal}&amountIn=${amountIn}&amountOut=${amountOut}&chainId=${chainId}`

    console.log(`Fetching KyberSwap price impact from: ${url}`)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), apiConfig.config.timeout || 10000)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`KyberSwap price impact API error: ${response.status}`)
    }

    const data: KyberSwapPriceImpactResponse = await response.json()

    if (data.code !== 0 || !data.data) {
      throw new Error(`KyberSwap price impact API error: ${data.message || "Invalid response"}`)
    }

    return data.data
  } catch (error) {
    console.error("Error fetching KyberSwap price impact:", error)
    return null
  }
}

// 获取Jupiter价格报价
const fetchJupiterQuote = async (
  apiConfig: ApiConfig,
  chainId: number,
  tokenInAddress: string,
  tokenOutAddress: string,
  amount: string,
  slippage = "0.005",
): Promise<PriceQuote | null> => {
  try {
    // Jupiter 只支持 Solana (chainId: 101)
    if (chainId !== 101) {
      console.error(`Jupiter does not support chain ID ${chainId}`)
      return null
    }

    // 构建 Jupiter API 请求URL
    const baseUrl = apiConfig.config.baseUrl || "https://ultra-api.jup.ag"
    const slippageBps = Math.floor(Number.parseFloat(slippage) * 10000) // 转换为基点

    const url = `${baseUrl}/order?inputMint=${tokenInAddress}&outputMint=${tokenOutAddress}&amount=${amount}&swapMode=ExactIn&slippageBps=${slippageBps}`

    console.log(`Fetching Jupiter quote from: ${url}`)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), apiConfig.config.timeout || 10000)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; ArbitrageBot/1.0)",
        ...(apiConfig.config.apiKey && {
          Authorization: `Bearer ${apiConfig.config.apiKey}`,
        }),
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Jupiter API error: ${response.status} - ${errorText}`)
      throw new Error(`Jupiter API error: ${response.status}`)
    }

    const data: JupiterQuoteResponse = await response.json()

    // 计算交换价格
    const amountIn = Number.parseFloat(data.inAmount)
    const amountOut = Number.parseFloat(data.outAmount)

    if (amountIn === 0) {
      throw new Error("Invalid input amount")
    }

    const swapPrice = amountOut / amountIn

    // 计算价格影响
    const priceImpact = Number.parseFloat(data.priceImpactPct) / 100

    // 构建交易路径步骤
    const routeSteps: RouteStep[] = data.routePlan.map((step) => ({
      dexName: step.swapInfo.label,
      poolAddress: step.swapInfo.ammKey,
      poolFee: step.swapInfo.feeAmount
        ? Number.parseFloat(step.swapInfo.feeAmount) / Number.parseFloat(step.swapInfo.inAmount)
        : 0.003,
      tokenIn: step.swapInfo.inputMint,
      tokenOut: step.swapInfo.outputMint,
      amountIn: step.swapInfo.inAmount,
      amountOut: step.swapInfo.outAmount,
    }))

    // 转换为统一格式
    const quote: PriceQuote = {
      status: "success",
      tokens: [
        {
          address: tokenInAddress,
          symbol: "IN",
          name: "Input Token",
          decimals: 6, // Solana 代币通常是 6 位小数
        },
        {
          address: tokenOutAddress,
          symbol: "OUT",
          name: "Output Token",
          decimals: 9, // SOL 是 9 位小数
        },
      ],
      tokenFrom: 0,
      tokenTo: 1,
      swapPrice,
      priceImpact,
      amountIn: data.inAmount,
      assumedAmountOut: data.outAmount,
      gasSpent: 5000, // Solana 交易费用很低，大约 5000 lamports
      provider: apiConfig.id,
      route: routeSteps,
    }

    console.log(`Jupiter quote successful: ${swapPrice} (${data.inAmount} -> ${data.outAmount})`)
    return quote
  } catch (error) {
    console.error("Error fetching Jupiter quote:", error)

    // 如果是网络错误或超时，返回null让系统尝试其他提供商
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        console.error("Jupiter request timed out")
      } else if (error.message.includes("Failed to fetch")) {
        console.error("Jupiter network error - API may be unavailable")
      }
    }

    return null
  }
}

// 获取KyberSwap支持的链名称
const getChainNameForKyberSwap = (chainId: number): string | null => {
  const chainMap: Record<number, string> = {
    1: "ethereum", // Ethereum
    137: "polygon", // Polygon
    56: "bsc", // Binance Smart Chain
    43114: "avalanche", // Avalanche
    42161: "arbitrum", // Arbitrum
    10: "optimism", // Optimism
    8453: "base", // Base
    324: "zksync", // ZKSync
    1101: "polygon-zkevm", // Polygon zkEVM
    59144: "linea", // Linea
    42170: "arbitrum-nova", // Arbitrum Nova
    534352: "scroll", // Scroll
    1116: "core", // Core
    250: "fantom", // Fantom
    5000: "mantle", // Mantle
  }

  return chainMap[chainId] || null
}

// 根据API配置获取价格报价
const fetchQuoteByProvider = async (
  apiConfig: ApiConfig,
  chainId: number,
  tokenInAddress: string,
  tokenOutAddress: string,
  amount: string,
  slippage = "0.005",
): Promise<PriceQuote | null> => {
  try {
    console.log(`Attempting to fetch quote from ${apiConfig.provider} for chain ${chainId}`)

    switch (apiConfig.provider) {
      case "1inch":
        return await fetch1InchQuote(apiConfig, chainId, tokenInAddress, tokenOutAddress, amount)
      case "sushi":
        return await fetchSushiQuote(apiConfig, chainId, tokenInAddress, tokenOutAddress, amount, slippage)
      case "uniswap":
        return await fetchUniswapQuote(apiConfig, chainId, tokenInAddress, tokenOutAddress, amount)
      case "paraswap":
        return await fetchParaSwapQuote(apiConfig, chainId, tokenInAddress, tokenOutAddress, amount)
      case "kyberswap":
        return await fetchKyberSwapQuote(apiConfig, chainId, tokenInAddress, tokenOutAddress, amount)
      case "jupiter":
        return await fetchJupiterQuote(apiConfig, chainId, tokenInAddress, tokenOutAddress, amount, slippage)
      default:
        console.warn(`Unknown API provider: ${apiConfig.provider}`)
        return null
    }
  } catch (error) {
    console.error(`Error fetching quote from ${apiConfig.provider}:`, error)
    return null
  }
}

// 获取指定API提供商的价格报价
export const fetchPriceQuoteFromProvider = async (
  chainName: string,
  tokenInSymbol: string,
  tokenOutSymbol: string,
  amount: string,
  providerId: string,
  slippage = "0.005",
): Promise<PriceQuote | null> => {
  try {
    const chainId = getChainId(chainName)
    const tokenInAddress = getTokenAddress(chainName, tokenInSymbol)
    const tokenOutAddress = getTokenAddress(chainName, tokenOutSymbol)

    if (!chainId || !tokenInAddress || !tokenOutAddress) {
      console.error("Invalid chain or token configuration")
      return null
    }

    const apiConfig = getApiConfig(providerId)
    if (!apiConfig || !apiConfig.enabled) {
      console.error(`API provider ${providerId} not found or disabled`)
      return null
    }

    if (!apiConfig.supportedChains.includes(chainId)) {
      console.error(`API provider ${providerId} does not support chain ${chainId}`)
      return null
    }

    // 获取代币的小数位数
    const tokenDecimals = await getTokenDecimals(chainId, tokenInAddress)
    console.log(`Using ${tokenDecimals} decimals for token ${tokenInSymbol} (${tokenInAddress})`)

    // 根据代币的实际小数位数转换金额
    const amountInWei = await convertToWeiWithDecimals(Number.parseFloat(amount), chainId, tokenInAddress)

    const quote = await fetchQuoteByProvider(apiConfig, chainId, tokenInAddress, tokenOutAddress, amountInWei, slippage)

    // 如果成功获取报价，将输出金额转换回小数格式
    if (quote) {
      // 获取输出代币的小数位数
      const outputTokenDecimals = await getTokenDecimals(chainId, tokenOutAddress)

      // 转换输出金额
      const decimalAmountOut = convertWeiToDecimal(quote.assumedAmountOut, outputTokenDecimals)

      console.log(`转换输出金额从 ${quote.assumedAmountOut} 到 ${decimalAmountOut}`)

      // 更新报价对象中的输出金额
      quote.assumedAmountOut = decimalAmountOut
    }

    return quote
  } catch (error) {
    console.error("Error fetching price quote from provider:", error)
    return null
  }
}

// 获取最佳价格报价（聚合多个API）
export const fetchBestPriceQuote = async (
  chainName: string,
  tokenInSymbol: string,
  tokenOutSymbol: string,
  amount: string,
  slippage = "0.005",
  preferredProviderId?: string,
): Promise<PriceQuote | null> => {
  try {
    const chainId = getChainId(chainName)
    const tokenInAddress = getTokenAddress(chainName, tokenInSymbol)
    const tokenOutAddress = getTokenAddress(chainName, tokenOutSymbol)

    if (!chainId || !tokenInAddress || !tokenOutAddress) {
      console.error("Invalid chain or token configuration")
      return null
    }

    // 获取代币的小数位数并转换金额
    const amountInWei = await convertToWeiWithDecimals(Number.parseFloat(amount), chainId, tokenInAddress)
    const availableConfigs = getApiConfigsForChain(chainId)

    if (availableConfigs.length === 0) {
      throw new Error(`No API providers available for chain ${chainId}`)
    }

    // 如果指定了首选提供商，优先使用
    let preferredConfig = null
    if (preferredProviderId) {
      preferredConfig = availableConfigs.find((config) => config.id === preferredProviderId)
    }

    // 如果没有指定首选提供商或找不到，使用第一个可用的
    if (!preferredConfig) {
      preferredConfig = availableConfigs[0]
    }

    console.log(`Trying preferred provider: ${preferredConfig.id}`)

    // 尝试首选提供商
    let quote = await fetchQuoteByProvider(
      preferredConfig,
      chainId,
      tokenInAddress,
      tokenOutAddress,
      amountInWei,
      slippage,
    )

    if (quote) {
      console.log(`Using provider ${preferredConfig.id}: ${quote.swapPrice}`)

      // 将输出金额转换回小数格式
      const outputTokenDecimals = await getTokenDecimals(chainId, tokenOutAddress)
      const decimalAmountOut = convertWeiToDecimal(quote.assumedAmountOut, outputTokenDecimals)

      console.log(`转换输出金额从 ${quote.assumedAmountOut} 到 ${decimalAmountOut}`)

      // 更新报价对象中的输出金额
      quote.assumedAmountOut = decimalAmountOut

      return quote
    }

    // 如果首选提供商失败，尝试其他提供商
    console.warn(`Preferred provider ${preferredConfig.id} failed, trying fallback providers`)

    for (const config of availableConfigs) {
      if (config.id === preferredConfig.id) continue // 跳过已经尝试过的

      console.log(`Trying fallback provider: ${config.id}`)

      quote = await fetchQuoteByProvider(config, chainId, tokenInAddress, tokenOutAddress, amountInWei, slippage)

      if (quote) {
        console.log(`Using fallback provider ${config.id}: ${quote.swapPrice}`)

        // 将输出金额转换回小数格式
        const outputTokenDecimals = await getTokenDecimals(chainId, tokenOutAddress)
        const decimalAmountOut = convertWeiToDecimal(quote.assumedAmountOut, outputTokenDecimals)

        console.log(`转换输出金额从 ${quote.assumedAmountOut} 到 ${decimalAmountOut}`)

        // 更新报价对象中的输出金额
        quote.assumedAmountOut = decimalAmountOut

        return quote
      }
    }

    console.error("All API providers failed for this request")
    return null
  } catch (error) {
    console.error("Error fetching best price quote:", error)
    return null
  }
}

// 向后兼容的价格查询函数
export const fetchPriceQuote = async (
  chainName: string,
  tokenInSymbol: string,
  tokenOutSymbol: string,
  amount: string,
  slippage = "0.005",
  fee = "0.0025",
): Promise<PriceQuote | null> => {
  return fetchBestPriceQuote(chainName, tokenInSymbol, tokenOutSymbol, amount, slippage)
}

// 获取多个DEX的价格比较
export const fetchMultiDexPrices = async (
  chainName: string,
  tokenInSymbol: string,
  tokenOutSymbol: string,
  amount: string,
): Promise<{ dex: string; price: number; quote: PriceQuote | null }[]> => {
  try {
    const chainId = getChainId(chainName)
    const tokenInAddress = getTokenAddress(chainName, tokenInSymbol)
    const tokenOutAddress = getTokenAddress(chainName, tokenOutSymbol)

    if (!chainId || !tokenInAddress || !tokenOutAddress) {
      return []
    }

    // 获取代币的小数位数并转换金额
    const amountInWei = await convertToWeiWithDecimals(Number.parseFloat(amount), chainId, tokenInAddress)
    const availableConfigs = getApiConfigsForChain(chainId)

    const results = await Promise.all(
      availableConfigs.map(async (config) => {
        const quote = await fetchQuoteByProvider(config, chainId, tokenInAddress, tokenOutAddress, amountInWei).catch(
          () => null,
        )

        // 如果成功获取报价，将输出金额转换回小数格式
        if (quote) {
          // 获取输出代币的小数位数
          const outputTokenDecimals = await getTokenDecimals(chainId, tokenOutAddress)

          // 转换输出金额
          const decimalAmountOut = convertWeiToDecimal(quote.assumedAmountOut, outputTokenDecimals)

          console.log(`${config.name}: 转换输出金额从 ${quote.assumedAmountOut} 到 ${decimalAmountOut}`)

          // 更新报价对象中的输出金额
          quote.assumedAmountOut = decimalAmountOut
        }

        return {
          dex: config.name,
          price: quote?.swapPrice || 0,
          quote,
        }
      }),
    )

    return results.filter((result) => result.price > 0)
  } catch (error) {
    console.error("Error fetching multi-DEX prices:", error)
    return []
  }
}

// 安全地将浮点数转换为Wei（避免BigInt精度问题）
function convertToWei(amount: number, decimals: number): string {
  // 确保使用完整表示而不是科学计数法
  let amountStr = amount.toLocaleString("fullwide", { useGrouping: false })

  const decimalPos = amountStr.indexOf(".")

  if (decimalPos === -1) {
    amountStr = amountStr + "0".repeat(decimals)
  } else {
    const decimalPart = amountStr.substring(decimalPos + 1)
    const decimalLength = decimalPart.length

    amountStr = amountStr.substring(0, decimalPos) + decimalPart

    if (decimalLength < decimals) {
      amountStr = amountStr + "0".repeat(decimals - decimalLength)
    } else if (decimalLength > decimals) {
      amountStr = amountStr.substring(0, amountStr.length - (decimalLength - decimals))
    }
  }

  amountStr = amountStr.replace(/^0+/, "")

  if (amountStr === "") {
    return "0"
  }

  return amountStr
}

// 根据代币地址和链ID获取代币小数位数并转换为wei
async function convertToWeiWithDecimals(amount: number, chainId: number, tokenAddress: string): Promise<string> {
  try {
    // 获取代币的实际小数位数
    const decimals = await getTokenDecimals(chainId, tokenAddress)
    console.log(`Converting amount ${amount} to wei with ${decimals} decimals for token ${tokenAddress}`)
    return convertToWei(amount, decimals)
  } catch (error) {
    console.warn(`无法获取代币小数位，使用默认18位: ${error}`)
    return convertToWei(amount, 18)
  }
}

// 将Wei格式转换回小数格式
function convertWeiToDecimal(weiAmount: string, decimals: number): string {
  // 确保使用完整表示而不是科学计数法
  const amountStr = weiAmount.replace(/^0+/, "") || "0"

  // 如果小数位数为0，直接返回
  if (decimals === 0) return amountStr

  // 处理金额字符串
  if (amountStr.length <= decimals) {
    // 如果长度小于等于小数位数，需要在前面补0
    const zerosToAdd = decimals - amountStr.length
    return "0." + "0".repeat(zerosToAdd) + amountStr.replace(/0+$/, "")
  } else {
    // 在适当位置插入小数点
    const decimalPosition = amountStr.length - decimals
    const integerPart = amountStr.substring(0, decimalPosition)
    const fractionalPart = amountStr.substring(decimalPosition).replace(/0+$/, "")
    return fractionalPart ? `${integerPart}.${fractionalPart}` : integerPart
  }
}

// 根据代币地址和链ID获取代币小数位数并转换回小数格式
async function convertWeiToDecimalWithDecimals(
  weiAmount: string,
  chainId: number,
  tokenAddress: string,
): Promise<string> {
  try {
    // 获取代币的实际小数位数
    const decimals = await getTokenDecimals(chainId, tokenAddress)
    console.log(
      `Converting wei amount ${weiAmount} back to decimal with ${decimals} decimals for token ${tokenAddress}`,
    )
    return convertWeiToDecimal(weiAmount, decimals)
  } catch (error) {
    console.warn(`无法获取代币小数位，使用默认18位: ${error}`)
    return convertWeiToDecimal(weiAmount, 18)
  }
}

// 修改executeArbitrageQuery函数以支持指定API提供商
export const executeArbitrageQuery = async (
  sourceChain: string,
  targetChain: string,
  sourceToken: string,
  targetToken: string,
  initialAmount: string,
  slippage = "0.005",
  preferredApiProvider?: string,
  fallbackApiProviders?: string[],
  gasFee?: string, // 新增: Gas费用配置
  networkFee?: string, // 新增: 网络费用配置
  bridgeFee?: string, // 新增: 跨链桥费用配置
  dexFee?: string, // 新增: DEX交易费用配置
): Promise<{
  sourcePrice: number
  targetPrice: number
  sourceOutputAmount: string
  finalOutputAmount: string
  profitPercentage: number
  profitAmount: string // 具体利润金额
  netProfitAmount: string // 净利润(扣除各种费用)
  netProfitPercentage: number // 净利润百分比
  sourceRoute?: RouteStep[]
  targetRoute?: RouteStep[]
  sourceApiProvider?: string
  targetApiProvider?: string
}> => {
  try {
    // 内部函数：直接获取价格报价，避免重复转换wei
    const getPriceQuoteDirect = async (
      chainName: string,
      tokenInSymbol: string,
      tokenOutSymbol: string,
      amount: string,
      isSourceChain: boolean,
    ): Promise<PriceQuote> => {
      const chainId = getChainId(chainName)
      const tokenInAddress = getTokenAddress(chainName, tokenInSymbol)
      const tokenOutAddress = getTokenAddress(chainName, tokenOutSymbol)

      if (!chainId || !tokenInAddress || !tokenOutAddress) {
        throw new Error(`无效的链或代币配置: ${chainName}, ${tokenInSymbol}, ${tokenOutSymbol}`)
      }

      // 只在源链交易时转换为wei格式，目标链交易使用原始输出金额
      let amountToUse = amount
      if (isSourceChain) {
        // 获取代币的小数位数并转换金额
        const amountInWei = await convertToWeiWithDecimals(Number.parseFloat(amount), chainId, tokenInAddress)
        amountToUse = amountInWei
      }

      console.log(`${isSourceChain ? "源链" : "目标链"}交易金额: ${amountToUse}`)

      const availableConfigs = getApiConfigsForChain(chainId)
      if (availableConfigs.length === 0) {
        throw new Error(`没有可用的API提供商: ${chainName}`)
      }

      // 使用指定的API提供商
      let apiConfig = availableConfigs[0]
      if (preferredApiProvider) {
        const preferred = availableConfigs.find((c) => c.id === preferredApiProvider)
        if (preferred) {
          apiConfig = preferred
        }
      }

      const quote = await fetchQuoteByProvider(
        apiConfig,
        chainId,
        tokenInAddress,
        tokenOutAddress,
        amountToUse,
        slippage,
      )

      if (!quote) {
        throw new Error(`无法获取价格报价: ${chainName}, ${tokenInSymbol} -> ${tokenOutSymbol}`)
      }

      return quote
    }

    // 1. 源链交易: sourceToken -> targetToken
    const sourceQuote = await getPriceQuoteDirect(
      sourceChain,
      sourceToken,
      targetToken,
      initialAmount,
      true, // 是源链交易
    )

    const sourceOutputAmount = sourceQuote.assumedAmountOut
    console.log(`源链输出金额: ${sourceOutputAmount} ${targetToken}`)
    console.log(`源链输出结果: ${JSON.stringify(sourceQuote)}`)
    // 确保sourceOutputAmount不使用科学计数法表示
    let adjustedSourceOutputAmount = sourceOutputAmount
    if (sourceOutputAmount.includes("e")) {
      const outputNum = Number(sourceOutputAmount)
      adjustedSourceOutputAmount = outputNum.toLocaleString("fullwide", { useGrouping: false })
      console.log(`转换输出金额从 ${sourceOutputAmount} 到 ${adjustedSourceOutputAmount}`)
    }

    // 2. 目标链交易: targetToken -> sourceToken
    const targetQuote = await getPriceQuoteDirect(
      targetChain,
      targetToken,
      sourceToken,
      adjustedSourceOutputAmount,
      false, // 不是源链交易，不需要再次转换为wei
    )

    console.log(`目标链交易结果: ${JSON.stringify(targetQuote)}`)

    const finalOutputAmount = targetQuote.assumedAmountOut
    console.log(`目标链输出金额: ${finalOutputAmount} ${sourceToken}`)

    // 使用返回的代币信息中的 decimals 字段来转换金额
    const decimalSourceOutputAmount = convertWeiToDecimal(
      sourceOutputAmount,
      sourceQuote.tokens[1].decimals, // 使用输出代币的 decimals
    )

    const decimalFinalOutputAmount = convertWeiToDecimal(
      finalOutputAmount,
      targetQuote.tokens[1].decimals, // 使用输出代币的 decimals
    )

    console.log(`转换后的源链输出金额: ${decimalSourceOutputAmount} ${targetToken}`)
    console.log(`转换后的最终输出金额: ${decimalFinalOutputAmount} ${sourceToken}`)

    // 使用转换后的小数金额计算利润
    const initialAmountNum = Number.parseFloat(initialAmount)
    const finalAmountNum = Number.parseFloat(decimalFinalOutputAmount)
    const profitPercentage = ((finalAmountNum - initialAmountNum) / initialAmountNum) * 100

    // 计算具体利润金额
    const profitAmount = (finalAmountNum - initialAmountNum).toFixed(6)

    // 计算预估费用 (使用策略配置中的值)
    const gasFeeCost = gasFee ? Number.parseFloat(gasFee) : 0.01 // 默认0.01
    const networkFeeCost = networkFee ? Number.parseFloat(networkFee) : 0.005 // 默认0.005
    const bridgeFeeCost = bridgeFee ? Number.parseFloat(bridgeFee) * initialAmountNum : initialAmountNum * 0.003 // 默认0.3%
    const dexFeeCost = dexFee ? Number.parseFloat(dexFee) * initialAmountNum : initialAmountNum * 0.003 // 默认0.3%

    // 计算净利润
    const totalFees = gasFeeCost + networkFeeCost + bridgeFeeCost + dexFeeCost
    const netProfit = finalAmountNum - initialAmountNum - totalFees
    const netProfitAmount = netProfit.toFixed(6)
    const netProfitPercentage = (netProfit / initialAmountNum) * 100

    return {
      sourcePrice: sourceQuote.swapPrice,
      targetPrice: targetQuote.swapPrice,
      sourceOutputAmount: decimalSourceOutputAmount, // 返回小数格式
      finalOutputAmount: decimalFinalOutputAmount, // 返回小数格式
      profitPercentage,
      profitAmount,
      netProfitAmount,
      netProfitPercentage,
      sourceRoute: sourceQuote.route,
      targetRoute: targetQuote.route,
      sourceApiProvider: sourceQuote.provider,
      targetApiProvider: targetQuote.provider,
    }
  } catch (error) {
    console.error("执行套利查询时出错:", error)
    throw error
  }
}

// 计算套利利润百分比
export const calculateProfitPercentage = (
  initialAmount: string,
  finalAmount: string,
  gasFee: string,
  networkFee: string,
): number => {
  // 确保金额是小数格式，处理可能的科学计数法
  const parseAmount = (amount: string): number => {
    if (amount.includes("e")) {
      return Number(amount)
    }
    return Number.parseFloat(amount)
  }

  const initialAmountNum = parseAmount(initialAmount)
  const finalAmountNum = parseAmount(finalAmount)
  const gasFeeBN = parseAmount(gasFee)
  const networkFeeBN = parseAmount(networkFee)

  const totalFees = gasFeeBN + networkFeeBN
  const netProfit = finalAmountNum - initialAmountNum - totalFees
  const profitPercentage = (netProfit / initialAmountNum) * 100

  return profitPercentage
}

// 获取代币价格历史数据 (模拟实现)
export const fetchTokenPriceHistory = async (
  chainName: string,
  tokenSymbol: string,
  timeframe = "1d",
): Promise<{ timestamp: number; price: number }[]> => {
  const mockData = []
  const now = Date.now()
  const hourMs = 3600 * 1000
  const dataPoints = timeframe === "1d" ? 24 : timeframe === "1w" ? 7 * 24 : 30 * 24

  for (let i = 0; i < dataPoints; i++) {
    mockData.push({
      timestamp: now - (dataPoints - i) * hourMs,
      price: 1 + Math.random() * 0.1,
    })
  }

  return mockData
}

// 估算跨链桥费用 (模拟实现)
export const estimateBridgeFee = async (
  sourceChain: string,
  targetChain: string,
  tokenSymbol: string,
  amount: string,
): Promise<{ fee: number; estimatedTime: number }> => {
  return {
    fee: Number.parseFloat(amount) * 0.003,
    estimatedTime: 10 * 60,
  }
}

// 执行交易 (模拟实现)
export const executeArbitrageTrade = async (
  strategyId: string,
  strategyName: string,
  sourceChain: string,
  targetChain: string,
  sourceToken: string,
  targetToken: string,
  amount: string,
  sourcePrice: number,
  targetPrice: number,
  profitPercentage: number,
): Promise<TradeExecution> => {
  // 确保金额是小数格式
  let decimalAmount = amount
  if (amount.includes("e")) {
    const amountNum = Number(amount)
    decimalAmount = amountNum.toString()
  }

  const execution: TradeExecution = {
    id: crypto.randomUUID(),
    strategyId,
    strategyName,
    sourceChain,
    targetChain,
    sourceToken,
    targetToken,
    amount: decimalAmount,
    sourcePrice,
    targetPrice,
    profitAmount: ((Number.parseFloat(decimalAmount) * profitPercentage) / 100).toFixed(4),
    profitPercentage,
    status: "pending",
    timestamp: Date.now(),
  }

  addTradeExecution(execution)

  return new Promise((resolve) => {
    setTimeout(() => {
      const isSuccess = Math.random() > 0.1

      if (isSuccess) {
        const updatedExecution: TradeExecution = {
          ...execution,
          status: "completed",
          txHash: `0x${Math.random().toString(16).substring(2, 66)}`,
        }
        updateTradeExecution(updatedExecution)
        resolve(updatedExecution)
      } else {
        const updatedExecution: TradeExecution = {
          ...execution,
          status: "failed",
          error: "交易执行失败，可能是因为价格波动或流动性不足",
        }
        updateTradeExecution(updatedExecution)
        resolve(updatedExecution)
      }
    }, 3000)
  })
}

// 通用函数：获取代币小数位数
export const getTokenDecimals = async (chainId: number, tokenAddress: string): Promise<number> => {
  // 原生代币(ETH, BNB等)通常是18位小数
  if (tokenAddress.toLowerCase() === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee") {
    return 18
  }

  // USDC, USDT通常是6位小数
  if (
    tokenAddress.toLowerCase() === "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" || // USDC on Ethereum
    tokenAddress.toLowerCase() === "0xdac17f958d2ee523a2206206994597c13d831ec7" || // USDT on Ethereum
    tokenAddress.toLowerCase() === "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913" // USDC on Base
  ) {
    return 6
  }

  // 其他常见代币
  const commonDecimals: Record<string, number> = {
    "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": 18, // WETH on Ethereum
    "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599": 8, // WBTC on Ethereum
    "0x4200000000000000000000000000000000000006": 18, // WETH on Base
  }

  if (commonDecimals[tokenAddress.toLowerCase()]) {
    return commonDecimals[tokenAddress.toLowerCase()]
  }

  // 检查缓存
  const cacheKey = `${chainId}:${tokenAddress.toLowerCase()}`
  if (tokenDecimalsCache[cacheKey] !== undefined) {
    console.log(`Using cached decimals for token ${tokenAddress}: ${tokenDecimalsCache[cacheKey]}`)
    return tokenDecimalsCache[cacheKey]
  }

  // 从配置中获取代币信息
  try {
    // 尝试从KyberSwap缓存中获取代币信息
    const token = getCachedTokenByAddress(chainId, tokenAddress)
    if (token) {
      // 存入缓存
      tokenDecimalsCache[cacheKey] = token.decimals
      console.log(`从KyberSwap缓存获取到代币小数位数: ${token.decimals}`)
      return token.decimals
    }
  } catch (error) {
    console.warn(`无法从配置获取代币小数位: ${error}`)
  }

  // 默认返回18，大多数ERC20代币都是18位小数
  console.warn(`无法获取代币 ${tokenAddress} 在链 ${chainId} 的小数位数，使用默认值18`)
  return 18
}

// 从区块链获取代币小数位数
export const fetchTokenDecimals = async (chainId: number, tokenAddress: string): Promise<number | null> => {
  // 此函数不再使用RPC URL查询，直接从配置获取
  try {
    // 检查缓存
    const cacheKey = `${chainId}:${tokenAddress.toLowerCase()}`
    if (tokenDecimalsCache[cacheKey] !== undefined) {
      console.log(`Using cached decimals for token ${tokenAddress}: ${tokenDecimalsCache[cacheKey]}`)
      return tokenDecimalsCache[cacheKey]
    }

    // 尝试从KyberSwap缓存中获取代币信息
    const token = getCachedTokenByAddress(chainId, tokenAddress)
    if (token) {
      // 存入缓存
      const result = token.decimals
      tokenDecimalsCache[cacheKey] = result
      console.log(`从KyberSwap缓存获取到代币小数位数: ${result}`)
      return result
    }

    console.warn(`无法获取代币 ${tokenAddress} 在链 ${chainId} 的小数位数`)
    return null
  } catch (error) {
    console.error(`Error fetching token decimals for ${tokenAddress} on chain ${chainId}:`, error)
    return null
  }
}
