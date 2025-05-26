import { getChainId, getTokenAddress } from "./config"
import { getApiConfig, getApiConfigsForChain } from "./api-config"
import { recordApiCall } from "./api-monitor"
import type { PriceQuote, RouteStep, TradeExecution, ApiConfig } from "./types"
import { addTradeExecution, updateTradeExecution } from "./storage"

// API提供商枚举
export enum ApiProvider {
  ONEINCH = "1inch",
  SUSHI = "sushi",
  UNISWAP = "uniswap",
  PARASWAP = "paraswap",
  ZEROX = "0x",
}

// SushiSwap API响应类型
interface SushiQuoteResponse {
  routeProcessorAddr: string
  tokenIn: string
  amountIn: string
  tokenOut: string
  amountOut: string
  amountOutMin: string
  to: string
  routeCode: string
  route: {
    status: string
    fromToken: {
      address: string
      symbol: string
      name: string
      decimals: number
    }
    toToken: {
      address: string
      symbol: string
      name: string
      decimals: number
    }
    primaryPrice: string
    swapPrice: string
    priceImpact: string
    amountIn: string
    amountOut: string
    amountOutMin: string
    gasSpent: string
    legs: Array<{
      poolAddress: string
      poolType: string
      poolFee: string
      tokenFrom: string
      tokenTo: string
      assumedAmountIn: string
      assumedAmountOut: string
    }>
  }
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

// 获取1inch价格报价
const fetch1InchQuote = async (
  apiConfig: ApiConfig,
  chainId: number,
  tokenInAddress: string,
  tokenOutAddress: string,
  amount: string,
): Promise<PriceQuote | null> => {
  return recordApiCall(apiConfig.id, `${apiConfig.config.baseUrl}${apiConfig.endpoints?.quote}`, chainId, async () => {
    const walletAddress = "0x0000000000000000000000000000000000000000"
    const endpoint = apiConfig.endpoints?.quote?.replace("{chainId}", chainId.toString()) || ""
    const url = `${apiConfig.config.baseUrl}${endpoint}?walletAddress=${walletAddress}&fromTokenAddress=${tokenInAddress}&toTokenAddress=${tokenOutAddress}&amount=${amount}&enableEstimate=false&source=0xe26b9977&showDestAmountMinusFee=true`

    console.log(`Fetching 1inch quote from: ${url}`)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), apiConfig.config.timeout || 10000)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(apiConfig.config.apiKey && { Authorization: `Bearer ${apiConfig.config.apiKey}` }),
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`1inch API error: ${response.status} ${response.statusText}`)
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
  })
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
  return recordApiCall(apiConfig.id, `${apiConfig.config.baseUrl}${apiConfig.endpoints?.quote}`, chainId, async () => {
    const endpoint = apiConfig.endpoints?.quote?.replace("{chainId}", chainId.toString()) || ""
    const fee = apiConfig.config.fee || "0.003"
    const url = `${apiConfig.config.baseUrl}${endpoint}?tokenIn=${tokenInAddress}&tokenOut=${tokenOutAddress}&amount=${amount}&maxSlippage=${slippage}&fee=${fee}&feeBy=output`

    console.log(`Fetching SushiSwap quote from: ${url}`)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), apiConfig.config.timeout || 8000)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(apiConfig.config.apiKey && { Authorization: `Bearer ${apiConfig.config.apiKey}` }),
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`SushiSwap API error: ${response.status} ${response.statusText}`)
    }

    const data: SushiQuoteResponse = await response.json()

    // 计算交换价格
    const amountIn = Number.parseFloat(data.amountIn)
    const amountOut = Number.parseFloat(data.amountOut)
    const swapPrice = amountOut / amountIn

    // 转换为统一格式
    const quote: PriceQuote = {
      status: "success",
      tokens: [
        {
          address: data.route.fromToken.address,
          symbol: data.route.fromToken.symbol,
          name: data.route.fromToken.name,
          decimals: data.route.fromToken.decimals,
        },
        {
          address: data.route.toToken.address,
          symbol: data.route.toToken.symbol,
          name: data.route.toToken.name,
          decimals: data.route.toToken.decimals,
        },
      ],
      tokenFrom: 0,
      tokenTo: 1,
      swapPrice,
      priceImpact: Number.parseFloat(data.route.priceImpact),
      amountIn: data.amountIn,
      assumedAmountOut: data.amountOut,
      gasSpent: Number.parseInt(data.route.gasSpent),
      provider: apiConfig.id,
      route: data.route.legs.map((leg) => ({
        dexName: "SushiSwap",
        poolAddress: leg.poolAddress,
        poolFee: Number.parseFloat(leg.poolFee),
        tokenIn: leg.tokenFrom,
        tokenOut: leg.tokenTo,
        amountIn: leg.assumedAmountIn,
        amountOut: leg.assumedAmountOut,
      })),
    }

    return quote
  })
}

// 获取Uniswap价格报价（模拟实现，因为Uniswap没有公开的免费API）
const fetchUniswapQuote = async (
  apiConfig: ApiConfig,
  chainId: number,
  tokenInAddress: string,
  tokenOutAddress: string,
  amount: string,
): Promise<PriceQuote | null> => {
  return recordApiCall(apiConfig.id, `${apiConfig.config.baseUrl}${apiConfig.endpoints?.quote}`, chainId, async () => {
    console.log(`Simulating Uniswap quote for chain ${chainId}`)

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
  })
}

// 获取ParaSwap价格报价（模拟）
const fetchParaSwapQuote = async (
  apiConfig: ApiConfig,
  chainId: number,
  tokenInAddress: string,
  tokenOutAddress: string,
  amount: string,
): Promise<PriceQuote | null> => {
  return recordApiCall(apiConfig.id, `${apiConfig.config.baseUrl}${apiConfig.endpoints?.quote}`, chainId, async () => {
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
  })
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
    switch (apiConfig.provider) {
      case "1inch":
        return await fetch1InchQuote(apiConfig, chainId, tokenInAddress, tokenOutAddress, amount)
      case "sushi":
        return await fetchSushiQuote(apiConfig, chainId, tokenInAddress, tokenOutAddress, amount, slippage)
      case "uniswap":
        return await fetchUniswapQuote(apiConfig, chainId, tokenInAddress, tokenOutAddress, amount)
      case "paraswap":
        return await fetchParaSwapQuote(apiConfig, chainId, tokenInAddress, tokenOutAddress, amount)
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

    const amountInWei = convertToWei(Number.parseFloat(amount), 18)
    return await fetchQuoteByProvider(apiConfig, chainId, tokenInAddress, tokenOutAddress, amountInWei, slippage)
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

    const amountInWei = convertToWei(Number.parseFloat(amount), 18)
    const availableConfigs = getApiConfigsForChain(chainId)

    if (availableConfigs.length === 0) {
      throw new Error(`No API providers available for chain ${chainId}`)
    }

    // 如果指定了首选提供商，优先使用
    if (preferredProviderId) {
      const preferredConfig = availableConfigs.find((config) => config.id === preferredProviderId)
      if (preferredConfig) {
        const quote = await fetchQuoteByProvider(
          preferredConfig,
          chainId,
          tokenInAddress,
          tokenOutAddress,
          amountInWei,
          slippage,
        )
        if (quote) {
          console.log(`Using preferred provider ${preferredProviderId}: ${quote.swapPrice}`)
          return quote
        }
        console.warn(`Preferred provider ${preferredProviderId} failed, falling back to others`)
      }
    }

    // 并行获取多个API的报价
    const promises = availableConfigs.map((config) =>
      fetchQuoteByProvider(config, chainId, tokenInAddress, tokenOutAddress, amountInWei, slippage).catch(() => null),
    )

    const results = await Promise.all(promises)
    const validQuotes = results.filter((quote): quote is PriceQuote => quote !== null)

    if (validQuotes.length === 0) {
      throw new Error("No valid quotes received from any API")
    }

    // 选择最佳报价（最高输出金额）
    const bestQuote = validQuotes.reduce((best, current) => {
      const bestOutput = Number.parseFloat(best.assumedAmountOut)
      const currentOutput = Number.parseFloat(current.assumedAmountOut)
      return currentOutput > bestOutput ? current : best
    })

    console.log(`Best quote from ${bestQuote.provider}: ${bestQuote.swapPrice}`)

    return bestQuote
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

    const amountInWei = convertToWei(Number.parseFloat(amount), 18)
    const availableConfigs = getApiConfigsForChain(chainId)

    const results = await Promise.all(
      availableConfigs.map(async (config) => {
        const quote = await fetchQuoteByProvider(config, chainId, tokenInAddress, tokenOutAddress, amountInWei).catch(
          () => null,
        )
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
  let amountStr = amount.toString()

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
): Promise<{
  sourcePrice: number
  targetPrice: number
  sourceOutputAmount: string
  finalOutputAmount: string
  profitPercentage: number
  sourceRoute?: RouteStep[]
  targetRoute?: RouteStep[]
  sourceApiProvider?: string
  targetApiProvider?: string
}> => {
  try {
    // 1. 源链交易: sourceToken -> targetToken
    const sourceQuote = await fetchBestPriceQuote(
      sourceChain,
      sourceToken,
      targetToken,
      initialAmount,
      slippage,
      preferredApiProvider,
    )

    if (!sourceQuote) {
      throw new Error("Failed to fetch source chain price quote")
    }

    const sourceOutputAmount = (Number.parseFloat(initialAmount) * sourceQuote.swapPrice).toString()
    console.log(`Source chain output: ${sourceOutputAmount} ${targetToken}`)

    // 2. 目标链交易: targetToken -> sourceToken
    const targetQuote = await fetchBestPriceQuote(
      targetChain,
      targetToken,
      sourceToken,
      sourceOutputAmount,
      slippage,
      preferredApiProvider,
    )

    if (!targetQuote) {
      throw new Error("Failed to fetch target chain price quote")
    }

    const finalOutputAmount = (Number.parseFloat(sourceOutputAmount) * targetQuote.swapPrice).toString()
    console.log(`Target chain output: ${finalOutputAmount} ${sourceToken}`)

    // 计算利润百分比
    const initialAmountNum = Number.parseFloat(initialAmount)
    const finalAmountNum = Number.parseFloat(finalOutputAmount)
    const profitPercentage = ((finalAmountNum - initialAmountNum) / initialAmountNum) * 100

    return {
      sourcePrice: sourceQuote.swapPrice,
      targetPrice: targetQuote.swapPrice,
      sourceOutputAmount,
      finalOutputAmount,
      profitPercentage,
      sourceRoute: sourceQuote.route,
      targetRoute: targetQuote.route,
      sourceApiProvider: sourceQuote.provider,
      targetApiProvider: targetQuote.provider,
    }
  } catch (error) {
    console.error("Error executing arbitrage query:", error)
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
  const initialAmountNum = Number.parseFloat(initialAmount)
  const finalAmountNum = Number.parseFloat(finalAmount)
  const gasFeeBN = Number.parseFloat(gasFee)
  const networkFeeBN = Number.parseFloat(networkFee)

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
  const execution: TradeExecution = {
    id: crypto.randomUUID(),
    strategyId,
    strategyName,
    sourceChain,
    targetChain,
    sourceToken,
    targetToken,
    amount,
    sourcePrice,
    targetPrice,
    profitAmount: ((Number.parseFloat(amount) * profitPercentage) / 100).toFixed(4),
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
