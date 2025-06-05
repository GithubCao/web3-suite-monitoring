"use client";

import { useEffect, useState } from 'react';
import { fetchKyberSwapChains, initializeTokensCache, getAppConfig } from '@/lib/config';
import { getApiConfigsForChain } from '@/lib/api-config';

export function TokenCacheInitializer() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState({
    chains: 0,
    tokens: 0,
    apis: 0
  });

  useEffect(() => {
    const initializeTokens = async () => {
      try {
        setStatus('loading');
        setMessage('正在加载网络信息...');
        
        // 确保我们有链信息
        const chains = await fetchKyberSwapChains();
        
        if (chains.length === 0) {
          throw new Error('无法获取网络信息');
        }
        
        setStats(prev => ({ ...prev, chains: chains.length }));
        setMessage(`已获取 ${chains.length} 个网络信息，正在加载代币数据...`);
        
        // 初始化代币缓存
        await initializeTokensCache();
        
        // 加载API配置
        let apiCount = 0;
        let tokenCount = 0;
        
        // 获取所有链的API配置
        for (const chain of chains) {
          const chainId = Number(chain.chainId);
          const apis = getApiConfigsForChain(chainId);
          apiCount += apis.length;
          
          // 统计代币数量
          try {
            const { getCachedTokensForChain } = await import('@/lib/config');
            const tokens = getCachedTokensForChain(chainId);
            tokenCount += tokens.length;
          } catch (error) {
            console.warn(`无法获取链 ${chain.displayName} 的代币数量:`, error);
          }
        }
        
        setStats(prev => ({ 
          ...prev, 
          tokens: tokenCount,
          apis: apiCount 
        }));
        
        setStatus('success');
        setMessage(`加载完成: ${chains.length}个网络, ${tokenCount}个代币, ${apiCount}个API`);
        
        // 3秒后隐藏消息
        setTimeout(() => {
          setIsVisible(false);
        }, 5000);
      } catch (error) {
        console.error('初始化数据失败:', error);
        setStatus('error');
        setMessage(`初始化失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    };

    // 检查应用配置
    const appConfig = getAppConfig();
    if (appConfig.autoLoadTokens) {
      setIsVisible(true);
      initializeTokens();
    }
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 max-w-sm">
      <div className="flex items-center">
        {status === 'loading' && (
          <svg className="animate-spin h-5 w-5 mr-3 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {status === 'success' && (
          <svg className="h-5 w-5 mr-3 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )}
        {status === 'error' && (
          <svg className="h-5 w-5 mr-3 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        )}
        <div className="flex flex-col">
          <span className={`text-sm ${status === 'error' ? 'text-red-600' : 'text-gray-700 dark:text-gray-300'}`}>
            {message}
          </span>
          {status === 'success' && (
            <div className="text-xs text-gray-500 mt-1">
              <span className="inline-flex items-center mr-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 mr-1"></span>
                网络: {stats.chains}
              </span>
              <span className="inline-flex items-center mr-2">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                代币: {stats.tokens}
              </span>
              <span className="inline-flex items-center">
                <span className="w-2 h-2 rounded-full bg-purple-500 mr-1"></span>
                API: {stats.apis}
              </span>
            </div>
          )}
        </div>
        <button 
          onClick={() => setIsVisible(false)}
          className="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}
