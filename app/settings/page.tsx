"use client"

import React, { useState, useEffect } from 'react';
import { getAppConfig, saveAppConfig, AppConfig, fetchKyberSwapChains, KyberSwapChain, initializeTokensCache } from '@/lib/config';

export default function SettingsPage() {
  const [config, setConfig] = useState<AppConfig>(getAppConfig());
  const [chains, setChains] = useState<KyberSwapChain[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    const loadChains = async () => {
      try {
        setLoading(true);
        const fetchedChains = await fetchKyberSwapChains();
        setChains(fetchedChains);
      } catch (error) {
        console.error('加载网络信息失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChains();
  }, []);

  const handleSaveConfig = async () => {
    try {
      setSaving(true);
      saveAppConfig(config);
      setMessage('配置已保存');
      setMessageType('success');

      // 如果启用了自动加载，立即开始加载代币
      if (config.autoLoadTokens) {
        setMessage('配置已保存，正在初始化代币数据...');
        await initializeTokensCache();
        setMessage('配置已保存，代币数据已初始化');
      }
    } catch (error) {
      console.error('保存配置失败:', error);
      setMessage(`保存失败: ${error instanceof Error ? error.message : '未知错误'}`);
      setMessageType('error');
    } finally {
      setSaving(false);

      // 3秒后清除消息
      setTimeout(() => {
        setMessage('');
      }, 3000);
    }
  };

  const togglePreferredChain = (chainId: string) => {
    setConfig(prev => {
      const currentPreferred = [...prev.preferredChains];
      const index = currentPreferred.indexOf(chainId);
      
      if (index === -1) {
        // 添加到优先列表
        return {
          ...prev,
          preferredChains: [...currentPreferred, chainId]
        };
      } else {
        // 从优先列表中移除
        currentPreferred.splice(index, 1);
        return {
          ...prev,
          preferredChains: currentPreferred
        };
      }
    });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">应用设置</h1>

      {message && (
        <div className={`mb-6 p-4 rounded ${messageType === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">基本设置</h2>
        
        <div className="mb-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={config.autoLoadTokens}
              onChange={(e) => setConfig({...config, autoLoadTokens: e.target.checked})}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>启动时自动加载代币数据</span>
          </label>
          <p className="text-sm text-gray-500 mt-1">
            启用后，应用启动时会自动获取所有支持网络的代币数据
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            缓存过期时间（小时）
          </label>
          <input
            type="number"
            min="1"
            max="72"
            value={config.cacheExpiry / (60 * 60 * 1000)}
            onChange={(e) => setConfig({...config, cacheExpiry: Number(e.target.value) * 60 * 60 * 1000})}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            最大并发请求数
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={config.maxConcurrentRequests}
            onChange={(e) => setConfig({...config, maxConcurrentRequests: Number(e.target.value)})}
            className="w-full p-2 border border-gray-300 rounded"
          />
          <p className="text-sm text-gray-500 mt-1">
            同时向API发送的最大请求数，较大的值可能导致API限流
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">优先网络设置</h2>
        <p className="text-sm text-gray-500 mb-4">
          选择优先加载代币数据的网络，这些网络将首先被加载
        </p>

        {loading ? (
          <div className="p-4 text-center">
            <svg className="animate-spin h-8 w-8 mx-auto text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-2 text-gray-600">加载网络信息中...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {chains.map((chain) => (
              <button
                key={chain.chainId}
                onClick={() => togglePreferredChain(chain.chainId)}
                className={`flex items-center p-2 border rounded ${
                  config.preferredChains.includes(chain.chainId) 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {chain.logoUrl && (
                  <div className="w-6 h-6 mr-2 relative">
                    <img 
                      src={chain.logoUrl} 
                      alt={chain.displayName}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <span className="text-sm">{chain.displayName}</span>
              </button>
            ))}
          </div>
        )}

        <div className="mt-4">
          <p className="text-sm text-gray-500 mb-2">
            优先顺序（从上到下）:
          </p>
          <div className="bg-gray-50 p-2 rounded">
            {config.preferredChains.length === 0 ? (
              <p className="text-sm text-gray-500">未选择任何优先网络</p>
            ) : (
              <ol className="list-decimal list-inside">
                {config.preferredChains.map(chainId => {
                  const chain = chains.find(c => c.chainId === chainId);
                  return (
                    <li key={chainId} className="text-sm">
                      {chain ? chain.displayName : chainId}
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSaveConfig}
          disabled={saving}
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {saving ? '保存中...' : '保存设置'}
        </button>
      </div>
    </div>
  );
}
