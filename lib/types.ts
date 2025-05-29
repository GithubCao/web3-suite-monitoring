// 链配置类型
export interface ChainConfig {
  [key: string]: number;
}

// 代币配置类型
export interface TokenConfig {
  [chain: string]: {
    [token: string]: string;
  };
}

// API配置类型
export interface ApiConfig {
  id: string;
  name: string;
  provider: string;
  enabled: boolean;
  priority: number;
  config: {
    apiKey?: string;
    baseUrl?: string;
    rateLimit?: number;
    timeout?: number;
    [key: string]: any;
  };
  supportedChains: number[];
  description?: string;
}

// 策略类型
export interface Strategy {
  id: string;
  name: string;
  sourceChain: string;
  sourceToken: string;
  sourceTargetToken: string; // 添加源链目标代币
  targetChain: string;
  targetToken: string;
  targetSourceToken: string; // 添加目标链源代币
  initialAmount: string;
  gasFee: string;
  networkFee: string;
  slippage: string;
  isActive: boolean;
  autoTrade: boolean; // 是否自动执行交易
  minProfitPercentage: string; // 最小利润百分比触发自动交易
  maxGasPrice: string; // 最大Gas价格 (Gwei)
  gasLimit: string; // Gas限制
  bridgeFee: string; // 跨链桥费用
  dexFee: string; // DEX交易费用
  preferredApiProvider?: string; // 首选API提供商
  fallbackApiProviders?: string[]; // 备用API提供商列表
  createdAt: number;
  updatedAt: number;
}

// 价格查询结果类型
export interface PriceQuote {
  status: string;
  tokens: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
  }[];
  tokenFrom: number;
  tokenTo: number;
  swapPrice: number;
  priceImpact: number;
  amountIn: string;
  assumedAmountOut: string;
  gasSpent: number;
  route?: RouteStep[]; // 新增：交易路径
  provider?: string; // API提供商
}

// 交易路径步骤
export interface RouteStep {
  dexName: string;
  poolAddress: string;
  poolFee: number;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
}

// 套利机会类型
export interface ArbitrageOpportunity {
  strategyId: string;
  strategyName: string;
  sourceChain: string;
  targetChain: string;
  sourcePrice: number;
  targetPrice: number;
  sourceOutputAmount: string;
  finalOutputAmount: string;
  profitPercentage: number;
  timestamp: number;
  sourceRoute?: RouteStep[]; // 新增：源链交易路径
  targetRoute?: RouteStep[]; // 新增：目标链交易路径
  sourceApiProvider?: string; // 源链使用的API提供商
  targetApiProvider?: string; // 目标链使用的API提供商
}

// 价格历史记录类型
export interface PriceHistoryRecord {
  id: string;
  strategyId: string;
  sourcePrice: number;
  targetPrice: number;
  sourceOutputAmount: string;
  finalOutputAmount: string;
  profitPercentage: number;
  timestamp: number;
}

// 交易执行记录类型
export interface TradeExecution {
  id: string;
  strategyId: string;
  strategyName: string;
  sourceChain: string;
  targetChain: string;
  sourceToken: string;
  targetToken: string;
  amount: string;
  sourcePrice: number;
  targetPrice: number;
  profitAmount: string;
  profitPercentage: number;
  status: "pending" | "completed" | "failed";
  txHash?: string;
  timestamp: number;
  error?: string;
}
