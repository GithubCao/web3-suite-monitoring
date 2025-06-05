"use client";

import { useEffect, useState } from "react";
import { fetchKyberSwapChains, initializeTokensCache, getAppConfig } from "@/lib/config";
import { getApiConfigsForChain } from "@/lib/api-config";
import { Loader2 } from "lucide-react";

export function ApiDataInitializer() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{
    chains: number;
    tokens: number;
    apis: number;
  }>({
    chains: 0,
    tokens: 0,
    apis: 0,
  });

  useEffect(() => {
    const initializeData = async () => {
      try {
        console.log("开始初始化API数据...");
        setLoading(true);

        // 1. 加载KyberSwap链数据
        const chains = await fetchKyberSwapChains();
        setStatus(prev => ({ ...prev, chains: chains.length }));
        console.log(`已加载${chains.length}个KyberSwap链`);

        // 2. 初始化代币缓存
        const appConfig = getAppConfig();
        if (appConfig.autoLoadTokens) {
          console.log("开始初始化代币缓存...");
          await initializeTokensCache();
          console.log("代币缓存初始化完成");
        }

        // 3. 加载API配置
        let apiCount = 0;
        for (const chain of chains) {
          const chainId = Number(chain.chainId);
          const apis = getApiConfigsForChain(chainId);
          apiCount += apis.length;
        }
        setStatus(prev => ({ ...prev, apis: apiCount }));
        console.log(`已加载${apiCount}个API配置`);

        setLoading(false);
      } catch (error) {
        console.error("初始化API数据失败:", error);
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  // 这个组件不渲染任何可见内容，只在开发模式下显示加载状态
  if (process.env.NODE_ENV === "development" && loading) {
    return (
      <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-2 rounded-md flex items-center z-50">
        <Loader2 className="w-3 h-3 mr-2 animate-spin" />
        正在加载API数据...
      </div>
    );
  }

  if (process.env.NODE_ENV === "development" && !loading) {
    return (
      <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-2 rounded-md z-50 opacity-80">
        已加载: {status.chains}个链, {status.apis}个API
      </div>
    );
  }

  return null;
}
