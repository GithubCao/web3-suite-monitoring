import type { ApiConfig } from "./types";

// 默认API配置
export const defaultApiConfigs: ApiConfig[] = [
  {
    id: "sushiswap",
    name: "SushiSwap",
    provider: "sushi",
    enabled: true,
    priority: 2,
    config: {
      baseUrl: "https://api.sushi.com",
      timeout: 8000,
      rateLimit: 200,
    },
    supportedChains: [1, 137, 42161, 56, 43114, 10, 8453], // 多链支持
    description: "SushiSwap API - 去中心化交易所，支持多链交易",
  },
  {
    id: "1inch-fusion",
    name: "1inch Fusion",
    provider: "1inch",
    enabled: false,
    priority: 1,
    config: {
      baseUrl: "https://proxy-app.1inch.io/v2.0/fusion/quoter/v2.0",
      timeout: 10000,
      rateLimit: 100, // 每分钟请求数
    },
    supportedChains: [1], // 仅支持以太坊主网
    description: "1inch Fusion API - 专业的DEX聚合器，提供最优价格路由",
  },

  {
    id: "uniswap-v3",
    name: "Uniswap V3",
    provider: "uniswap",
    enabled: false,
    priority: 3,
    config: {
      baseUrl: "https://api.uniswap.org/v1",
      timeout: 8000,
      rateLimit: 150,
    },
    supportedChains: [1, 137, 42161, 10, 8453], // 主要链支持
    description: "Uniswap V3 API - 最大的去中心化交易所",
  },
  {
    id: "paraswap",
    name: "ParaSwap",
    provider: "paraswap",
    enabled: false,
    priority: 4,
    config: {
      baseUrl: "https://apiv5.paraswap.io",
      timeout: 10000,
      rateLimit: 100,
      apiKey: "", // 需要用户配置
    },
    supportedChains: [1, 137, 56, 43114, 10, 42161],
    description: "ParaSwap API - DEX聚合器，需要API密钥",
  },
  {
    id: "0x-protocol",
    name: "0x Protocol",
    provider: "0x",
    enabled: false,
    priority: 5,
    config: {
      baseUrl: "https://api.0x.org",
      timeout: 8000,
      rateLimit: 100,
      apiKey: "", // 需要用户配置
    },
    supportedChains: [1, 137, 56, 43114, 10, 42161],
    description: "0x Protocol API - 专业交易基础设施，需要API密钥",
  },
];

// API配置存储键
const API_CONFIG_KEY = "web3-arbitrage-api-config";

// 保存API配置
export const saveApiConfigs = (configs: ApiConfig[]): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem(API_CONFIG_KEY, JSON.stringify(configs));
  }
};

// 获取API配置
export const getApiConfigs = (): ApiConfig[] => {
  if (typeof window !== "undefined") {
    const data = localStorage.getItem(API_CONFIG_KEY);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (error) {
        console.error("Error parsing API configs:", error);
      }
    }
  }
  return [...defaultApiConfigs];
};

// 获取单个API配置
export const getApiConfig = (id: string): ApiConfig | null => {
  const configs = getApiConfigs();
  return configs.find((config) => config.id === id) || null;
};

// 更新API配置
export const updateApiConfig = (updatedConfig: ApiConfig): void => {
  const configs = getApiConfigs();
  const index = configs.findIndex((config) => config.id === updatedConfig.id);

  if (index !== -1) {
    configs[index] = updatedConfig;
    saveApiConfigs(configs);
  }
};

// 添加新API配置
export const addApiConfig = (config: ApiConfig): void => {
  const configs = getApiConfigs();
  configs.push(config);
  saveApiConfigs(configs);
};

// 删除API配置
export const deleteApiConfig = (id: string): void => {
  const configs = getApiConfigs();
  const filteredConfigs = configs.filter((config) => config.id !== id);
  saveApiConfigs(filteredConfigs);
};

// 获取启用的API配置（按优先级排序）
export const getEnabledApiConfigs = (): ApiConfig[] => {
  return getApiConfigs()
    .filter((config) => config.enabled)
    .sort((a, b) => a.priority - b.priority);
};

// 获取支持特定链的API配置
export const getApiConfigsForChain = (chainId: number): ApiConfig[] => {
  return getEnabledApiConfigs().filter((config) =>
    config.supportedChains.includes(chainId)
  );
};

// 重置为默认配置
export const resetApiConfigs = (): void => {
  saveApiConfigs([...defaultApiConfigs]);
};

// 验证API配置
export const validateApiConfig = (
  config: ApiConfig
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!config.id) errors.push("API ID 不能为空");
  if (!config.name) errors.push("API 名称不能为空");
  if (!config.provider) errors.push("API 提供商不能为空");
  if (config.priority < 1) errors.push("优先级必须大于0");
  if (!config.config.baseUrl) errors.push("基础URL不能为空");
  if (config.config.timeout && config.config.timeout < 1000)
    errors.push("超时时间不能少于1秒");
  if (config.config.rateLimit && config.config.rateLimit < 1)
    errors.push("速率限制必须大于0");

  return {
    valid: errors.length === 0,
    errors,
  };
};

// 获取API提供商选项
export const getApiProviderOptions = (): {
  value: string;
  label: string;
  description: string;
}[] => {
  const configs = getEnabledApiConfigs();
  return configs.map((config) => ({
    value: config.id,
    label: config.name,
    description: config.description || "",
  }));
};
