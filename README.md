# Crypto Arbitrage Platform

一个功能强大的加密货币套利平台，支持多链、多DEX的价格比较和套利机会发现。

## 项目概述

Crypto Arbitrage Platform是一个用于发现和执行加密货币套利机会的工具。它能够连接多个DEX和聚合器API，比较不同平台上的代币价格，并帮助用户发现和执行有利可图的套利交易。

## 主要功能

- **多链支持**: 支持以太坊、BSC、Polygon、Arbitrum、Optimism、Base等多个区块链网络
- **多DEX集成**: 集成SushiSwap、1inch、Uniswap、ParaSwap、0x Protocol和KyberSwap等多个DEX和聚合器
- **套利策略**: 创建、管理和监控自定义套利策略
- **实时价格比较**: 比较不同DEX上的代币价格，寻找套利机会
- **自动化交易**: 支持基于预设利润阈值的自动套利交易
- **交易历史记录**: 追踪和分析已执行的套利交易
- **费用估算**: 考虑gas费、网络费、跨链桥费用和DEX交易费用，计算净利润
- **价格影响分析**: 评估交易对市场的影响，避免大额交易滑点过大

## 支持的API提供商

目前平台支持以下API提供商:

1. **SushiSwap** - 去中心化交易所，支持多链交易
2. **1inch Fusion** - 专业的DEX聚合器，提供最优价格路由
3. **Uniswap V3** - 最大的去中心化交易所
4. **ParaSwap** - DEX聚合器，需要API密钥
5. **0x Protocol** - 专业交易基础设施，需要API密钥
6. **KyberSwap** - 高效DEX聚合器，支持多链、多DEX交易路由

## KyberSwap集成

KyberSwap是一个强大的DEX聚合器，能够在多个区块链网络上为用户提供最佳交易路径。我们已将KyberSwap集成到平台中，以提供更好的价格和更多的交易选项。

### KyberSwap API支持的链:
- Ethereum (以太坊)
- Polygon (多边形)
- BSC (币安智能链)
- Avalanche (雪崩)
- Arbitrum (仲裁)
- Optimism (乐观)
- Base
- ZKSync
- Polygon zkEVM
- Linea
- Arbitrum Nova
- Scroll
- Core
- Fantom
- Mantle

### KyberSwap API 功能:

1. **路由查询** - 提供最佳交易路径，整合多个DEX的流动性
   - 接口: `https://aggregator-api.kyberswap.com/{chainName}/api/v1/routes`
   - 参数: tokenIn, tokenOut, amountIn, gasInclude

2. **价格影响分析** - 评估交易对市场价格的影响
   - 接口: `https://bff.kyberswap.com/api/v1/price-impact`
   - 参数: tokenIn, tokenInDecimal, tokenOut, tokenOutDecimal, amountIn, amountOut, chainId
   - 返回: 美元价值和价格影响百分比

### KyberSwap API 使用示例:

\`\`\`typescript
// 获取交易报价
const quote = await fetchPriceQuoteFromProvider(
  "base",      // 链名称
  "ETH",       // 输入代币
  "USDC",      // 输出代币
  "11",        // 数量（11个ETH）
  "kyberswap", // API提供商ID
  "0.005"      // 滑点设置
);

// 获取价格影响
const priceImpact = await fetchKyberSwapPriceImpact(
  apiConfig,
  8453,                                         // Base链ID
  "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // ETH
  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC
  "11000000000000000000",                      // 输入金额(11 ETH，以wei为单位)
  "30041144312",                               // 输出金额(30041.144312 USDC，以最小单位为单位)
  18,                                          // ETH小数位数
  6                                            // USDC小数位数
);
\`\`\`

更多详细示例请参考 [lib/examples/kyberswap-example.ts](lib/examples/kyberswap-example.ts)

## 使用方法

### 创建套利策略

1. 在策略页面点击"创建新策略"
2. 选择源链和目标链
3. 选择要交易的代币对
4. 设置初始交易金额和最小利润阈值
5. 配置相关费用和首选API提供商
6. 保存策略

### 执行套利交易

1. 在策略列表中查看可用的套利机会
2. 选择利润率最高的机会
3. 点击"执行交易"按钮
4. 确认交易详情
5. 等待交易完成

### 配置API提供商

1. 在设置页面中导航到"API配置"选项卡
2. 启用或禁用所需的API提供商
3. 设置API密钥（如果需要）
4. 调整提供商优先级
5. 保存设置

## API文档

### 套利查询

\`\`\`typescript
executeArbitrageQuery(
  sourceChain: string,
  targetChain: string,
  sourceToken: string,
  targetToken: string,
  initialAmount: string,
  slippage = "0.005",
  preferredApiProvider?: string,
  fallbackApiProviders?: string[],
  gasFee?: string,
  networkFee?: string,
  bridgeFee?: string,
  dexFee?: string
)
\`\`\`

### 价格查询

\`\`\`typescript
fetchPriceQuoteFromProvider(
  chainName: string,
  tokenInSymbol: string, 
  tokenOutSymbol: string,
  amount: string,
  providerId: string,
  slippage = "0.005"
)
\`\`\`

### 多DEX价格比较

\`\`\`typescript
fetchMultiDexPrices(
  chainName: string,
  tokenInSymbol: string,
  tokenOutSymbol: string,
  amount: string
)
\`\`\`

### 价格影响查询

\`\`\`typescript
fetchKyberSwapPriceImpact(
  apiConfig: ApiConfig,
  chainId: number,
  tokenInAddress: string,
  tokenOutAddress: string,
  amountIn: string,
  amountOut: string,
  tokenInDecimal?: number,
  tokenOutDecimal?: number
)
\`\`\`

## 技术栈

- **前端**: Next.js, React, TypeScript, Tailwind CSS
- **API集成**: 多个DEX和聚合器API
- **数据存储**: 本地存储 (LocalStorage)

## 开发指南

### 安装依赖

\`\`\`bash
npm install
# 或
yarn install
# 或
pnpm install
\`\`\`

### 运行开发服务器

\`\`\`bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
\`\`\`

### 构建生产版本

\`\`\`bash
npm run build
# 或
yarn build
# 或
pnpm build
\`\`\`

## 贡献指南

1. Fork项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启Pull Request

## 许可证

本项目采用MIT许可证 - 详情请参阅LICENSE文件
