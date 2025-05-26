import type { ChainConfig, TokenConfig } from "./types"

// 导入从附件中提供的链ID映射
export const ChainIdMap: ChainConfig = {
  ETHEREUM: 1,
  GÖRLI: 5,
  POLYGON: 137,
  POLYGON_TESTNET: 80001,
  FANTOM: 250,
  FANTOM_TESTNET: 4002,
  GNOSIS: 100,
  BSC: 56,
  BSC_TESTNET: 97,
  ARBITRUM: 42161,
  ARBITRUM_NOVA: 42170,
  ARBITRUM_TESTNET: 421614,
  AVALANCHE: 43114,
  AVALANCHE_TESTNET: 43113,
  HECO: 128,
  HARMONY: 1666600000,
  OKEX: 66,
  CELO: 42220,
  PALM: 705969163,
  MOONRIVER: 1285,
  FUSE: 122,
  TELOS: 40,
  MOONBEAM: 1284,
  OPTIMISM: 10,
  KAVA: 2222,
  METIS: 1088,
  BOBA: 288,
  BOBA_AVAX: 43288,
  BOBA_BNB: 56288,
  BTTC: 199,
  SEPOLIA: 11155111,
  POLYGON_ZKEVM: 1101,
  THUNDERCORE: 108,
  FILECOIN: 314,
  HAQQ: 11235,
  CORE: 1116,
  ZKSYNC_ERA: 324,
  LINEA: 59144,
  BASE: 8453,
  SCROLL: 534352,
  ZETACHAIN: 7000,
  CRONOS: 25,
  BLAST: 81457,
  SKALE_EUROPA: 2046399126,
  ROOTSTOCK: 30,
  MANTLE: 5000,
  CURTIS: 33111,
  MANTA: 169,
  MODE: 34443,
  TAIKO: 167000,
  ZKLINK: 810180,
  APE: 33139,
  SONIC: 146,
  HEMI: 43111,
}

// 导入从附件中提供的代币地址映射
export const tokensByChain: TokenConfig = {
  ETHEREUM: {
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    WBTC: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    LINK: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
    AAVE: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",
    UNI: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    SUSHI: "0x6B3595068778DD592e39A122f4f5a5cF09C90fE2",
    SNX: "0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F",
    MATIC: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
    CRV: "0xD533a949740bb3306d119CC777fa900bA034cd52",
    wstETH: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0",
  },
  POLYGON: {
    USDC: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    USDT: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    DAI: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
    WETH: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
    WBTC: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6",
    WPOL: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
    LINK: "0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39",
    AAVE: "0xD6DF932A45C0f255f85145f286eA0b292B21C90B",
    UNI: "0xb33EaAd8d922B1083446DC23f610c2567fB5180f",
    SUSHI: "0x0b3F868E0BE5597D5DB7fEB59E1CADBb0fdDa50a",
    SNX: "0x50B728D8D964fd00C2d0AAD81718b71311feF68a",
    CRV: "0x172370d5Cd63279eFa6d502DAB29171933a610AF",
    MATIC: "0x0000000000000000000000000000000000001010",
  },
  ARBITRUM: {
    USDC: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    USDT: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
    DAI: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
    WETH: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    WBTC: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f",
    LINK: "0xf97f4df75117a78c1A5a0DBb814Af92458539FB4",
    UNI: "0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0",
    SUSHI: "0xd4d42F0b6DEF4CE0383636770eF773390d85c61A",
    CRV: "0x11cdb42b0eb46d95f990bedd4695a6e3fa034978",
    ARB: "0x912CE59144191C1204E64559FE8253a0e49E6548",
    wstETH: "0x5979D7b546E38E414F7E9822514be443A4800529",
  },
  BSC: {
    USDC: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    USDT: "0x55d398326f99059fF775485246999027B3197955",
    DAI: "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3",
    WETH: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8",
    WBTC: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8",
    WBNB: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
    LINK: "0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD",
    UNI: "0xBf5140A22578168FD562DCcF235E5D43A02ce9B1",
    SUSHI: "0x986cdF0fd180b40c4D6aEAA01Ab740B996D8b782",
  },
  AVALANCHE: {
    USDC: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
    USDT: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7",
    DAI: "0xd586E7F844cEa2F87f50152665BCbc2C279D8d70",
    WETH: "0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB",
    WBTC: "0x50b7545627a5162F82A992c33b87aDc75187B218",
    WAVAX: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
    LINK: "0x5947BB275c521040051D82396192181b413227A3",
    AAVE: "0x63a72806098Bd3D9520cC43356dD78afe5D386D9",
    SUSHI: "0x37B608519F91f70F2EeB0e5Ed9AF4061722e4F76",
  },
  OPTIMISM: {
    USDC: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    USDT: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e94",
    DAI: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
    WETH: "0x4200000000000000000000000000000000000006",
    WBTC: "0x68f180fcCe6836688e9084f035309E29Bf0A2095",
    LINK: "0x350a791Bfc2C21F9Ed5d10980Dad2e2638ffa7f6",
    AAVE: "0x76FB31fb4af56892A25e32cFC43De717950c9278",
    SNX: "0x8700dAec35aF8Ff88c16BdF0418774CB3D7599B4",
    CRV: "0x0994206dfE8De6Ec6920FF4D779B0d950605Fb53",
    OP: "0x4200000000000000000000000000000000000042",
    wstETH: "0x1F32b1c2345538c0c6f582fCB022739c4A194Ebb",
  },
  BASE: {
    USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    USDT: "0xfde4c96c8593536e31f229ea8f37b2ada2699bb2",
    DAI: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
    WETH: "0x4200000000000000000000000000000000000006",
    wstETH: "0xB6fe221Fe9EeF5aBa221c348bA20A1Bf5e73624c",
  },
  LINEA: {
    USDC: "0x176211869cA2b568f2A7D4EE941E073a821EE1ff",
    USDT: "0xa219439258ca9da29e9cc4ce5596924745e12b93",
    DAI: "0x5C7e299CF531eb66f2A1dF637d37AbB78e6200C7",
    WETH: "0xe5D7C2a44FfDDf6b295A15c148167daaAf5Cf34f",
  },
  SCROLL: {
    USDC: "0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4",
    USDT: "0xf55BEC9cafDbE8730f096Aa55dad6D22d44099Df",
    DAI: "0xcA77eB3fEFe3725Dc33bccB54eDEFc3D9f764f97",
    WETH: "0x5300000000000000000000000000000000000004",
    wstETH: "0xf610A9dfB7C89644979b4A0f27063E9e7d7Cda32",
  },
  ZKSYNC_ERA: {
    USDC: "0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4",
    WETH: "0x5AEa5775959fBC2557Cc8789bC1bf90A239D9a91",
    WBTC: "0xBBeB516fb02a01611cBBE0453Fe3c580D7281011",
  },
  BLAST: {
    USDB: "0x4300000000000000000000000000000000000003",
    WETH: "0x4300000000000000000000000000000000000004",
  },
  MANTA: {
    USDC: "0xb73603C5d87fA094B7314C74ACE2e64D165016fb",
    USDT: "0xf417F5A458eC102B90352F697D6e2Ac3A3d2851f",
    WETH: "0x0Dc808adcE2099A9F62AA87D9670745AbA741746",
  },
  ROOTSTOCK: {
    USDC: "0x1BDA44fda023f2aF8280A16FD1b01d1a493BA6C4",
    USDT: "0xef213441A85dF4d7ACbDaE0Cf78004e1E486bB96",
    DAI: "0x6B1A73d547F4009a26B8485B63d7015d248Ad406",
    WBTC: "0x542fDA317318eBF1d3DEAf76E0b632741A7e677d",
  },
}

// 动态配置变量 - 使用缓存避免重复加载
let dynamicChainIdMap: ChainConfig | null = null
let dynamicTokensByChain: TokenConfig | null = null

// 获取动态配置（带缓存）
const getDynamicConfig = (): { chains: ChainConfig; tokens: TokenConfig } => {
  if (dynamicChainIdMap === null || dynamicTokensByChain === null) {
    // 初始化为默认值
    dynamicChainIdMap = { ...ChainIdMap }
    dynamicTokensByChain = { ...tokensByChain }

    // 尝试加载保存的配置
    if (typeof window !== "undefined") {
      try {
        const savedConfig = localStorage.getItem("web3-arbitrage-config")
        if (savedConfig) {
          const config = JSON.parse(savedConfig)
          if (config.chains) {
            dynamicChainIdMap = { ...ChainIdMap, ...config.chains }
          }
          if (config.tokens) {
            dynamicTokensByChain = { ...tokensByChain, ...config.tokens }
          }
        }
      } catch (error) {
        console.error("Error loading saved config:", error)
      }
    }
  }

  return {
    chains: dynamicChainIdMap,
    tokens: dynamicTokensByChain,
  }
}

// 重置缓存（当配置更新时调用）
export const resetConfigCache = (): void => {
  dynamicChainIdMap = null
  dynamicTokensByChain = null
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
  const { tokens } = getDynamicConfig()
  if (!tokens[chain] || !tokens[chain][token]) return ""
  return tokens[chain][token]
}

// 获取链ID
export const getChainId = (chain: string): number => {
  const { chains } = getDynamicConfig()
  return chains[chain] || 0
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
    if (tokens[tokenSymbol]) {
      addresses[chain] = tokens[tokenSymbol]
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

// 获取当前动态配置
export const getCurrentConfig = (): { chains: ChainConfig; tokens: TokenConfig } => {
  return getDynamicConfig()
}
