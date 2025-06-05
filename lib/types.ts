// 链配置类型
export type ChainConfig = Record<string, number>

// 代币详情类型
export interface TokenDetail {
  chainId: number
  address: string
  symbol: string
  name: string
  decimals: number
  logoURI?: string
}

// 代币配置类型（支持字符串地址或TokenDetail对象）
export type TokenConfig = Record<string, Record<string, string | TokenDetail>>

// 价格查询API配置类型
export interface ApiConfig {
  id: string
  name: string
  provider: string
  enabled: boolean
  priority: number
  config: {
    baseUrl?: string
    apiKey?: string
    timeout?: number
    rateLimit?: number
    [key: string]: any
  }
  supportedChains: number[]
  description?: string
}

// 价格报价类型
export interface PriceQuote {
  status: string
  tokens: {
    address: string
    symbol: string
    name: string
    decimals: number
  }[]
  tokenFrom: number
  tokenTo: number
  swapPrice: number
  priceImpact: number
  amountIn: string
  assumedAmountOut: string
  gasSpent: number
  provider: string
  route: RouteStep[]
}

// 交易路径步骤类型
export interface RouteStep {
  dexName: string
  poolAddress: string
  poolFee: number
  tokenIn: string
  tokenOut: string
  amountIn: string
  amountOut: string
}

// 交易执行记录类型
export interface TradeExecution {
  id: string
  strategyId: string
  strategyName: string
  sourceChain: string
  targetChain: string
  sourceToken: string
  targetToken: string
  amount: string
  sourcePrice: number
  targetPrice: number
  profitAmount: string
  profitPercentage: number
  status: "pending" | "completed" | "failed"
  timestamp: number
  txHash?: string
  error?: string
}

// 策略配置类型
export interface Strategy {
  id: string
  name: string
  description: string
  sourceChain: string
  targetChain: string
  sourceToken: string
  targetToken: string
  sourceTargetToken?: string
  targetSourceToken?: string
  amount: string
  minProfitPercentage: number
  enabled: boolean
  preferredApiProvider?: string
  fallbackApiProviders?: string[]
  gasFee?: string
  networkFee?: string
  bridgeFee?: string
  dexFee?: string
  slippage?: string
  maxGasPrice?: string
  gasLimit?: string
  autoTrade?: boolean
  walletAddress?: string // 新增: 关联的钱包地址
  interval: number
  lastRun?: number
  lastProfit?: number
}

// 套利机会类型
export interface ArbitrageOpportunity {
  strategyId: string
  strategyName: string
  sourceChain: string
  targetChain: string
  sourcePrice: number
  targetPrice: number
  sourceOutputAmount: string
  finalOutputAmount: string
  profitPercentage: number
  timestamp: number
  sourceRoute?: RouteStep[]
  targetRoute?: RouteStep[]
}

// 价格历史记录类型
export interface PriceHistoryRecord {
  id: string
  strategyId: string
  sourcePrice: number
  targetPrice: number
  sourceOutputAmount: string
  finalOutputAmount: string
  profitPercentage: number
  timestamp: number
}

// 通知配置类型
export interface NotificationConfig {
  enabled: boolean
  minProfitPercentage: number
  channels: {
    email?: {
      enabled: boolean
      address: string
    }
    telegram?: {
      enabled: boolean
      botToken: string
      chatId: string
    }
    discord?: {
      enabled: boolean
      webhookUrl: string
    }
  }
}
