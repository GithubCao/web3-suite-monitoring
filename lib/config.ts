import type { ChainConfig, TokenConfig } from "./types";

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
};

// 导入从附件中提供的代币地址映射
export const tokensByChain: TokenConfig = {
  ARBITRUM: {
    SQD: "0x1337420dED5ADb9980CFc35f8f2B054ea86f8aB1",
    SFUND: "0x560363BdA52BC6A44CA6C8c9B4a5FadbDa32fa60",
    KIP: "0xF63b14F5eE5574e3F337b2796Bbdf6dcfB4E2CB7",
    STAR: "0xB299751B088336E165dA313c33e3195B8c6663A6",
  },
  BASE: {
    SQD: "0xd4554BEa546EFa83C1E6B389ecac40EA999B3E78",
    OX: "0xba0Dda8762C24dA9487f5FA026a9B64b695A07Ea",
    RWA: "0xE2B1dc2D4A3b4E59FDF0c47B71A7A86391a8B35a",
  },
  ETHEREUM: {
    VOW: "0x1BBf25e71EC48B84d773809B4bA55B6F4bE946Fb",
    OX: "0xba0Dda8762C24dA9487f5FA026a9B64b695A07Ea",
    WCT: "0xeF4461891DfB3AC8572cCf7C794664A8DD927945",
    KIP: "0x946fb08103b400d1c79e07acCCDEf5cfd26cd374",
    STAR: "0xB299751B088336E165dA313c33e3195B8c6663A6",
  },
  BSC: {
    VOW: "0xF585B5b4f22816BAf7629AEA55B701662630397b",
    SFUND: "0x477bC8d23c634C154061869478bce96BE6045D12",
    RWA: "0xE2B1dc2D4A3b4E59FDF0c47B71A7A86391a8B35a",
  },
  OPTIMISM: {
    WCT: "0xeF4461891DfB3AC8572cCf7C794664A8DD927945",
  },
};

// 动态配置变量 - 使用缓存避免重复加载
let dynamicChainIdMap: ChainConfig | null = null;
let dynamicTokensByChain: TokenConfig | null = null;

// 获取动态配置（带缓存）
const getDynamicConfig = (): { chains: ChainConfig; tokens: TokenConfig } => {
  if (dynamicChainIdMap === null || dynamicTokensByChain === null) {
    // 初始化为默认值
    dynamicChainIdMap = { ...ChainIdMap };
    dynamicTokensByChain = { ...tokensByChain };

    // 尝试加载保存的配置
    if (typeof window !== "undefined") {
      try {
        const savedConfig = localStorage.getItem("web3-arbitrage-config");
        if (savedConfig) {
          const config = JSON.parse(savedConfig);
          if (config.chains) {
            dynamicChainIdMap = { ...ChainIdMap, ...config.chains };
          }
          if (config.tokens) {
            dynamicTokensByChain = { ...tokensByChain, ...config.tokens };
          }
        }
      } catch (error) {
        console.error("Error loading saved config:", error);
      }
    }
  }

  return {
    chains: dynamicChainIdMap,
    tokens: dynamicTokensByChain,
  };
};

// 重置缓存（当配置更新时调用）
export const resetConfigCache = (): void => {
  dynamicChainIdMap = null;
  dynamicTokensByChain = null;
};

// 获取链名称列表
export const getChainNames = (): string[] => {
  const { chains } = getDynamicConfig();
  return Object.keys(chains);
};

// 获取特定链上的代币列表
export const getTokensForChain = (chain: string): string[] => {
  const { tokens } = getDynamicConfig();
  if (!tokens[chain]) return [];
  return Object.keys(tokens[chain]);
};

// 获取代币地址
export const getTokenAddress = (chain: string, token: string): string => {
  const { tokens } = getDynamicConfig();
  if (!tokens[chain] || !tokens[chain][token]) return "";
  return tokens[chain][token];
};

// 获取链ID
export const getChainId = (chain: string): number => {
  const { chains } = getDynamicConfig();
  return chains[chain] || 0;
};

// 获取链的简短名称
export const getChainShortName = (chainId: number): string => {
  const networkInfo = getNetworkInfo(chainId);
  return networkInfo ? networkInfo.shortName : "";
};

// 获取链的完整名称
export const getChainFullName = (chainId: number): string => {
  const networkInfo = getNetworkInfo(chainId);
  return networkInfo ? networkInfo.name : "";
};

// 获取链的原生代币信息
export const getNativeCurrency = (
  chainId: number
): { name: string; symbol: string; decimals: number } | null => {
  const networkInfo = getNetworkInfo(chainId);
  return networkInfo ? networkInfo.nativeCurrency : null;
};

// 获取链的区块浏览器URL
export const getExplorerUrl = (chainId: number): string => {
  const networkInfo = getNetworkInfo(chainId);
  if (
    networkInfo &&
    networkInfo.explorers &&
    networkInfo.explorers.length > 0
  ) {
    return networkInfo.explorers[0].url;
  }
  return "";
};

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
  };
};

// 通过chainId获取链名称
const getChainNameByChainId = (chainId: number): string => {
  for (const [name, id] of Object.entries(ChainIdMap)) {
    if (id === chainId) {
      return name;
    }
  }
  return "Unknown Chain";
};

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
  };

  return shortNameMap[chainId] || "unknown";
};

// 获取所有支持的代币符号
export const getAllTokenSymbols = (): string[] => {
  const symbols = new Set<string>();

  Object.values(tokensByChain).forEach((tokens) => {
    Object.keys(tokens).forEach((symbol) => {
      symbols.add(symbol);
    });
  });

  return Array.from(symbols);
};

// 获取特定代币在所有链上的地址
export const getTokenAddressesAcrossChains = (
  tokenSymbol: string
): Record<string, string> => {
  const addresses: Record<string, string> = {};

  Object.entries(tokensByChain).forEach(([chain, tokens]) => {
    if (tokens[tokenSymbol]) {
      addresses[chain] = tokens[tokenSymbol];
    }
  });

  return addresses;
};

// 检查两条链是否都支持特定代币
export const checkTokenSupportedOnBothChains = (
  sourceChain: string,
  targetChain: string,
  tokenSymbol: string
): boolean => {
  const { tokens } = getDynamicConfig();
  return !!(
    tokens[sourceChain] &&
    tokens[targetChain] &&
    tokens[sourceChain][tokenSymbol] &&
    tokens[targetChain][tokenSymbol]
  );
};

// 获取两条链共同支持的代币
export const getCommonTokens = (chain1: string, chain2: string): string[] => {
  const { tokens } = getDynamicConfig();
  if (!tokens[chain1] || !tokens[chain2]) return [];

  const tokens1 = new Set(Object.keys(tokens[chain1]));
  const tokens2 = new Set(Object.keys(tokens[chain2]));

  return Array.from(tokens1).filter((token) => tokens2.has(token));
};

// 获取当前动态配置
export const getCurrentConfig = (): {
  chains: ChainConfig;
  tokens: TokenConfig;
} => {
  return getDynamicConfig();
};
