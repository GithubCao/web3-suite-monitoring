import type {
  Strategy,
  PriceHistoryRecord,
  TradeExecution,
  ChainConfig,
  TokenConfig,
} from "./types";

// 本地存储键
const STRATEGIES_KEY = "web3-arbitrage-strategies";
const PRICE_HISTORY_KEY = "web3-arbitrage-price-history";
const TRADE_EXECUTIONS_KEY = "web3-arbitrage-trade-executions";

// 保存策略到本地存储
export const saveStrategies = (strategies: Strategy[]): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem(STRATEGIES_KEY, JSON.stringify(strategies));
  }
};

// 从本地存储获取策略
export const getStrategies = (): Strategy[] => {
  if (typeof window !== "undefined") {
    const data = localStorage.getItem(STRATEGIES_KEY);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (error) {
        console.error("Error parsing strategies:", error);
      }
    }
  }
  return [];
};

// 添加新策略
export const addStrategy = (strategy: Strategy): void => {
  const strategies = getStrategies();
  strategies.push(strategy);
  saveStrategies(strategies);
};

// 更新策略
export const updateStrategy = (updatedStrategy: Strategy): void => {
  const strategies = getStrategies();
  const index = strategies.findIndex((s) => s.id === updatedStrategy.id);

  if (index !== -1) {
    strategies[index] = {
      ...updatedStrategy,
      updatedAt: Date.now(),
    };
    saveStrategies(strategies);
  }
};

// 删除策略
export const deleteStrategy = (id: string): void => {
  const strategies = getStrategies();
  const filteredStrategies = strategies.filter((s) => s.id !== id);
  saveStrategies(filteredStrategies);
};

// 获取单个策略
export const getStrategyById = (id: string): Strategy | null => {
  const strategies = getStrategies();
  const strategy = strategies.find((s) => s.id === id);
  return strategy || null;
};

// 更新策略活动状态
export const updateStrategyStatus = (id: string, isActive: boolean): void => {
  const strategies = getStrategies();
  const index = strategies.findIndex((s) => s.id === id);

  if (index !== -1) {
    strategies[index] = {
      ...strategies[index],
      isActive,
      updatedAt: Date.now(),
    };
    saveStrategies(strategies);
  }
};

// 更新策略自动交易设置
export const updateStrategyAutoTrade = (
  id: string,
  autoTrade: boolean,
  minProfitPercentage?: string
): void => {
  const strategies = getStrategies();
  const index = strategies.findIndex((s) => s.id === id);

  if (index !== -1) {
    strategies[index] = {
      ...strategies[index],
      autoTrade,
      minProfitPercentage:
        minProfitPercentage || strategies[index].minProfitPercentage || "1.0",
      updatedAt: Date.now(),
    };
    saveStrategies(strategies);
  }
};

// 保存价格历史记录
export const savePriceHistory = (records: PriceHistoryRecord[]): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem(PRICE_HISTORY_KEY, JSON.stringify(records));
  }
};

// 获取价格历史记录
export const getPriceHistory = (): PriceHistoryRecord[] => {
  if (typeof window !== "undefined") {
    const data = localStorage.getItem(PRICE_HISTORY_KEY);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (error) {
        console.error("Error parsing price history:", error);
      }
    }
  }
  return [];
};

// 添加价格历史记录
export const addPriceHistoryRecord = (record: PriceHistoryRecord): void => {
  const history = getPriceHistory();

  // 获取当前策略的历史记录
  const strategyHistory = history.filter(
    (r) => r.strategyId === record.strategyId
  );

  // 如果已经有10条或更多记录，只保留最新的9条
  if (strategyHistory.length >= 10) {
    // 按时间戳排序
    strategyHistory.sort((a, b) => b.timestamp - a.timestamp);

    // 只保留最新的9条记录
    const latestRecords = strategyHistory.slice(0, 9);

    // 从总历史记录中移除所有与当前策略相关的记录
    const otherHistory = history.filter(
      (r) => r.strategyId !== record.strategyId
    );

    // 将筛选后的9条记录和新记录添加到历史记录中
    const updatedHistory = [...otherHistory, ...latestRecords, record];
    savePriceHistory(updatedHistory);
  } else {
    // 如果记录少于10条，直接添加新记录
    history.push(record);
    savePriceHistory(history);
  }
};

// 获取特定策略的价格历史记录
export const getStrategyPriceHistory = (
  strategyId: string
): PriceHistoryRecord[] => {
  const history = getPriceHistory();
  return history
    .filter((record) => record.strategyId === strategyId)
    .sort((a, b) => b.timestamp - a.timestamp);
};

// 保存交易执行记录
export const saveTradeExecutions = (executions: TradeExecution[]): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem(TRADE_EXECUTIONS_KEY, JSON.stringify(executions));
  }
};

// 获取交易执行记录
export const getTradeExecutions = (): TradeExecution[] => {
  if (typeof window !== "undefined") {
    const data = localStorage.getItem(TRADE_EXECUTIONS_KEY);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (error) {
        console.error("Error parsing trade executions:", error);
      }
    }
  }
  return [];
};

// 添加交易执行记录
export const addTradeExecution = (execution: TradeExecution): void => {
  const executions = getTradeExecutions();
  executions.push(execution);
  saveTradeExecutions(executions);
};

// 更新交易执行记录
export const updateTradeExecution = (
  updatedExecution: TradeExecution
): void => {
  const executions = getTradeExecutions();
  const index = executions.findIndex((e) => e.id === updatedExecution.id);

  if (index !== -1) {
    executions[index] = updatedExecution;
    saveTradeExecutions(executions);
  }
};

// 获取特定策略的交易执行记录
export const getStrategyTradeExecutions = (
  strategyId: string
): TradeExecution[] => {
  const executions = getTradeExecutions();
  return executions
    .filter((execution) => execution.strategyId === strategyId)
    .sort((a, b) => b.timestamp - a.timestamp);
};

// 添加复制策略功能
export const duplicateStrategy = (id: string): Strategy | null => {
  const strategy = getStrategyById(id);

  if (!strategy) return null;

  const newStrategy: Strategy = {
    ...strategy,
    id: crypto.randomUUID(),
    name: `${strategy.name} (复制)`,
    isActive: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  addStrategy(newStrategy);
  return newStrategy;
};

// 添加导出策略功能
export const exportStrategies = (ids?: string[]): string => {
  const strategies = getStrategies();
  const strategiesToExport = ids
    ? strategies.filter((s) => ids.includes(s.id))
    : strategies;

  return JSON.stringify(strategiesToExport);
};

// 添加导入策略功能
export const importStrategies = (
  jsonData: string
): { success: boolean; count: number; error?: string } => {
  try {
    const strategies = JSON.parse(jsonData) as Strategy[];

    if (!Array.isArray(strategies)) {
      return { success: false, count: 0, error: "无效的数据格式" };
    }

    // 验证每个策略的格式
    const validStrategies = strategies.filter(
      (s) =>
        s.id &&
        s.name &&
        s.sourceChain &&
        s.sourceToken &&
        s.targetChain &&
        s.targetToken &&
        s.initialAmount
    );

    // 为每个导入的策略生成新ID
    const strategiesToImport = validStrategies.map((s) => ({
      ...s,
      id: crypto.randomUUID(),
      isActive: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));

    // 获取现有策略
    const existingStrategies = getStrategies();

    // 合并并保存
    saveStrategies([...existingStrategies, ...strategiesToImport]);

    return { success: true, count: strategiesToImport.length };
  } catch (error) {
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : "导入失败",
    };
  }
};

// 配置存储键
const CONFIG_KEY = "web3-arbitrage-config";

// 配置类型
interface AppConfig {
  chains: ChainConfig;
  tokens: TokenConfig;
}

// 保存配置到本地存储
export const saveConfig = (chains: ChainConfig, tokens: TokenConfig): void => {
  if (typeof window !== "undefined") {
    const config: AppConfig = { chains, tokens };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  }
};

// 从本地存储获取配置
export const getConfig = (): AppConfig | null => {
  if (typeof window !== "undefined") {
    const data = localStorage.getItem(CONFIG_KEY);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (error) {
        console.error("Error parsing config:", error);
      }
    }
  }
  return null;
};

// 重置配置为默认值
export const resetConfig = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(CONFIG_KEY);
  }
};
