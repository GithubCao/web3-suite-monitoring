"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import type { ChainConfig, TokenConfig, ApiConfig } from "@/lib/types"
import { ChainIdMap, tokensByChain, resetConfigCache } from "@/lib/config"
import { useToast } from "@/components/ui/use-toast"
import { Separator } from "@/components/ui/separator"
import { Search, Plus, Trash2, Settings2, Key, Globe, Zap } from "lucide-react"
import { getConfig, resetConfig, saveConfig as saveConfigToStorage } from "@/lib/storage"
import {
  getApiConfigs,
  saveApiConfigs,
  resetApiConfigs,
  updateApiConfig,
  addApiConfig,
  deleteApiConfig,
  validateApiConfig,
  defaultApiConfigs,
} from "@/lib/api-config"

export default function SettingsPage() {
  const [chains, setChains] = useState<ChainConfig>({ ...ChainIdMap })
  const [tokens, setTokens] = useState<TokenConfig>({ ...tokensByChain })
  const [apiConfigs, setApiConfigs] = useState<ApiConfig[]>([])
  const [selectedChain, setSelectedChain] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoaded, setIsLoaded] = useState(false)
  const { toast } = useToast()

  // 获取链名称列表（使用本地状态避免循环依赖）
  const chainNames = Object.keys(chains)

  useEffect(() => {
    if (!isLoaded) {
      // 加载保存的配置
      const savedConfig = getConfig()
      if (savedConfig) {
        setChains(savedConfig.chains)
        setTokens(savedConfig.tokens)
      }

      // 加载API配置
      const savedApiConfigs = getApiConfigs()
      setApiConfigs(savedApiConfigs)

      if (chainNames.length > 0 && !selectedChain) {
        setSelectedChain(chainNames[0])
      }

      setIsLoaded(true)
    }
  }, [isLoaded, chainNames, selectedChain])

  // 链配置相关函数
  const addChain = () => {
    setChains({
      ...chains,
      NEW_CHAIN: 0,
    })
  }

  const updateChain = (oldKey: string, newKey: string, value: number) => {
    const updatedChains = { ...chains }

    if (oldKey !== newKey) {
      delete updatedChains[oldKey]

      if (tokens[oldKey]) {
        const updatedTokens = { ...tokens }
        updatedTokens[newKey] = updatedTokens[oldKey]
        delete updatedTokens[oldKey]
        setTokens(updatedTokens)
      }
    }

    updatedChains[newKey] = value
    setChains(updatedChains)
  }

  const deleteChain = (key: string) => {
    const updatedChains = { ...chains }
    delete updatedChains[key]

    const updatedTokens = { ...tokens }
    delete updatedTokens[key]

    setChains(updatedChains)
    setTokens(updatedTokens)
  }

  // 代币配置相关函数
  const addToken = (chain: string) => {
    const updatedTokens = { ...tokens }

    if (!updatedTokens[chain]) {
      updatedTokens[chain] = {}
    }

    updatedTokens[chain]["NEW_TOKEN"] = "0x"
    setTokens(updatedTokens)
  }

  const updateToken = (chain: string, oldKey: string, newKey: string, value: string) => {
    const updatedTokens = { ...tokens }

    if (!updatedTokens[chain]) {
      updatedTokens[chain] = {}
    }

    if (oldKey !== newKey) {
      delete updatedTokens[chain][oldKey]
    }

    updatedTokens[chain][newKey] = value
    setTokens(updatedTokens)
  }

  const deleteToken = (chain: string, token: string) => {
    const updatedTokens = { ...tokens }

    if (updatedTokens[chain]) {
      delete updatedTokens[chain][token]
    }

    setTokens(updatedTokens)
  }

  // API配置相关函数
  const handleApiConfigUpdate = (updatedConfig: ApiConfig) => {
    const validation = validateApiConfig(updatedConfig)
    if (!validation.valid) {
      toast({
        title: "配置验证失败",
        description: validation.errors.join(", "),
        variant: "destructive",
      })
      return
    }

    updateApiConfig(updatedConfig)
    setApiConfigs(apiConfigs.map((config) => (config.id === updatedConfig.id ? updatedConfig : config)))

    toast({
      title: "API配置已更新",
      description: `${updatedConfig.name} 配置已成功更新`,
    })
  }

  const handleAddApiConfig = () => {
    const newConfig: ApiConfig = {
      id: `custom-${Date.now()}`,
      name: "自定义API",
      provider: "custom",
      enabled: false,
      priority: apiConfigs.length + 1,
      config: {
        baseUrl: "",
        timeout: 10000,
        rateLimit: 100,
      },
      supportedChains: [1],
      description: "自定义API配置",
    }

    addApiConfig(newConfig)
    setApiConfigs([...apiConfigs, newConfig])
  }

  const handleDeleteApiConfig = (id: string) => {
    deleteApiConfig(id)
    setApiConfigs(apiConfigs.filter((config) => config.id !== id))

    toast({
      title: "API配置已删除",
      description: "API配置已成功删除",
    })
  }

  const resetApiConfigsToDefault = () => {
    resetApiConfigs()
    setApiConfigs([...defaultApiConfigs])

    toast({
      title: "API配置已重置",
      description: "已恢复为默认API配置",
    })
  }

  // 保存配置
  const saveConfig = () => {
    try {
      saveConfigToStorage(chains, tokens)
      saveApiConfigs(apiConfigs)
      resetConfigCache()

      toast({
        title: "配置已保存",
        description: "所有配置已成功保存到本地存储",
      })
    } catch (error) {
      toast({
        title: "保存失败",
        description: "无法保存配置，请稍后再试",
        variant: "destructive",
      })
    }
  }

  // 重置配置函数
  const resetToDefaults = () => {
    resetConfig()
    resetConfigCache()
    resetApiConfigsToDefault()
    setChains({ ...ChainIdMap })
    setTokens({ ...tokensByChain })

    toast({
      title: "配置已重置",
      description: "已恢复为默认配置",
    })
  }

  // 过滤函数
  const filteredChains = Object.entries(chains).filter(([key]) => key.toLowerCase().includes(searchQuery.toLowerCase()))

  const filteredTokens =
    selectedChain && tokens[selectedChain]
      ? Object.entries(tokens[selectedChain]).filter(
          ([key, value]) =>
            key.toLowerCase().includes(searchQuery.toLowerCase()) ||
            value.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : []

  const filteredApiConfigs = apiConfigs.filter(
    (config) =>
      config.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      config.provider.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (!isLoaded) {
    return <div className="flex items-center justify-center h-full">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">配置设置</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetToDefaults}>
            重置为默认
          </Button>
          <Button onClick={saveConfig}>保存配置</Button>
        </div>
      </div>

      <div className="flex items-center space-x-2 mb-4">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="搜索链、代币或API..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Tabs defaultValue="chains">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chains">链配置</TabsTrigger>
          <TabsTrigger value="tokens">代币配置</TabsTrigger>
          <TabsTrigger value="apis">API配置</TabsTrigger>
        </TabsList>

        <TabsContent value="chains" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>区块链配置</CardTitle>
              <CardDescription>配置您需要监控的区块链网络和对应的 Chain ID</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredChains.map(([key, value], index) => (
                <div key={index} className="flex items-end gap-4">
                  <div className="space-y-2 flex-1">
                    <Label>链名称</Label>
                    <Input value={key} onChange={(e) => updateChain(key, e.target.value, value)} placeholder="链名称" />
                  </div>
                  <div className="space-y-2 flex-1">
                    <Label>Chain ID</Label>
                    <Input
                      type="number"
                      value={value}
                      onChange={(e) => updateChain(key, key, Number.parseInt(e.target.value))}
                      placeholder="Chain ID"
                    />
                  </div>
                  <Button variant="destructive" onClick={() => deleteChain(key)} className="mb-0.5">
                    删除
                  </Button>
                </div>
              ))}

              <Button variant="outline" onClick={addChain} className="w-full">
                添加新链
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tokens" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>代币配置</CardTitle>
              <CardDescription>配置每条链上的代币地址</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>选择链</Label>
                <Select value={selectedChain} onValueChange={setSelectedChain}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择链" />
                  </SelectTrigger>
                  <SelectContent>
                    {chainNames.map((chain) => (
                      <SelectItem key={chain} value={chain}>
                        {chain}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedChain && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">{selectedChain}</h3>
                    <Button variant="outline" size="sm" onClick={() => addToken(selectedChain)}>
                      添加代币
                    </Button>
                  </div>

                  <Separator />

                  {filteredTokens.length > 0 ? (
                    filteredTokens.map(([tokenKey, tokenValue], tokenIndex) => (
                      <div key={tokenIndex} className="flex items-end gap-4">
                        <div className="space-y-2 flex-1">
                          <Label>代币符号</Label>
                          <Input
                            value={tokenKey}
                            onChange={(e) => updateToken(selectedChain, tokenKey, e.target.value, tokenValue)}
                            placeholder="代币符号"
                          />
                        </div>
                        <div className="space-y-2 flex-1">
                          <Label>代币地址</Label>
                          <Input
                            value={tokenValue}
                            onChange={(e) => updateToken(selectedChain, tokenKey, tokenKey, e.target.value)}
                            placeholder="代币地址"
                          />
                        </div>
                        <Button
                          variant="destructive"
                          onClick={() => deleteToken(selectedChain, tokenKey)}
                          className="mb-0.5"
                        >
                          删除
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-2 text-muted-foreground">
                      {searchQuery ? "没有找到匹配的代币" : "该链上没有配置代币"}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="apis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>API配置</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={resetApiConfigsToDefault}>
                    重置API配置
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleAddApiConfig}>
                    <Plus className="mr-2 h-4 w-4" />
                    添加API
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>配置价格查询API提供商和相关参数</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {filteredApiConfigs.map((config) => (
                <ApiConfigCard
                  key={config.id}
                  config={config}
                  onUpdate={handleApiConfigUpdate}
                  onDelete={handleDeleteApiConfig}
                />
              ))}

              {filteredApiConfigs.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  {searchQuery ? "没有找到匹配的API配置" : "暂无API配置"}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// API配置卡片组件
function ApiConfigCard({
  config,
  onUpdate,
  onDelete,
}: {
  config: ApiConfig
  onUpdate: (config: ApiConfig) => void
  onDelete: (id: string) => void
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [editedConfig, setEditedConfig] = useState<ApiConfig>({ ...config })

  const handleUpdate = () => {
    onUpdate(editedConfig)
  }

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith("config.")) {
      const configField = field.replace("config.", "")
      setEditedConfig({
        ...editedConfig,
        config: {
          ...editedConfig.config,
          [configField]: value,
        },
      })
    } else {
      setEditedConfig({
        ...editedConfig,
        [field]: value,
      })
    }
  }

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case "1inch":
        return <Zap className="h-4 w-4" />
      case "sushi":
        return <Globe className="h-4 w-4" />
      case "uniswap":
        return <Globe className="h-4 w-4" />
      case "paraswap":
        return <Key className="h-4 w-4" />
      case "0x":
        return <Key className="h-4 w-4" />
      default:
        return <Settings2 className="h-4 w-4" />
    }
  }

  return (
    <Card className={`transition-all ${config.enabled ? "border-green-200 bg-green-50/50" : "border-gray-200"}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getProviderIcon(config.provider)}
            <div>
              <CardTitle className="text-lg">{config.name}</CardTitle>
              <CardDescription className="flex items-center space-x-2">
                <span>{config.description}</span>
                <Badge variant={config.enabled ? "default" : "secondary"}>{config.enabled ? "启用" : "禁用"}</Badge>
                <Badge variant="outline">优先级 {config.priority}</Badge>
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={editedConfig.enabled}
              onCheckedChange={(checked) => handleInputChange("enabled", checked)}
            />
            <Button variant="outline" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
              <Settings2 className="h-4 w-4" />
            </Button>
            <Button variant="destructive" size="sm" onClick={() => onDelete(config.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 space-y-4">
          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>API名称</Label>
              <Input
                value={editedConfig.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="API名称"
              />
            </div>

            <div className="space-y-2">
              <Label>提供商</Label>
              <Input
                value={editedConfig.provider}
                onChange={(e) => handleInputChange("provider", e.target.value)}
                placeholder="提供商标识"
              />
            </div>

            <div className="space-y-2">
              <Label>优先级</Label>
              <Input
                type="number"
                min="1"
                value={editedConfig.priority}
                onChange={(e) => handleInputChange("priority", Number.parseInt(e.target.value))}
                placeholder="优先级"
              />
            </div>

            <div className="space-y-2">
              <Label>基础URL</Label>
              <Input
                value={editedConfig.config.baseUrl || ""}
                onChange={(e) => handleInputChange("config.baseUrl", e.target.value)}
                placeholder="https://api.example.com"
              />
            </div>

            <div className="space-y-2">
              <Label>API密钥 (可选)</Label>
              <Input
                type="password"
                value={editedConfig.config.apiKey || ""}
                onChange={(e) => handleInputChange("config.apiKey", e.target.value)}
                placeholder="API密钥"
              />
            </div>

            <div className="space-y-2">
              <Label>超时时间 (毫秒)</Label>
              <Input
                type="number"
                min="1000"
                value={editedConfig.config.timeout || 10000}
                onChange={(e) => handleInputChange("config.timeout", Number.parseInt(e.target.value))}
                placeholder="10000"
              />
            </div>

            <div className="space-y-2">
              <Label>速率限制 (每分钟)</Label>
              <Input
                type="number"
                min="1"
                value={editedConfig.config.rateLimit || 100}
                onChange={(e) => handleInputChange("config.rateLimit", Number.parseInt(e.target.value))}
                placeholder="100"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>描述</Label>
            <Input
              value={editedConfig.description || ""}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="API描述"
            />
          </div>

          <div className="space-y-2">
            <Label>支持的链 (Chain IDs)</Label>
            <Input
              value={editedConfig.supportedChains.join(", ")}
              onChange={(e) => {
                const chainIds = e.target.value
                  .split(",")
                  .map((id) => Number.parseInt(id.trim()))
                  .filter((id) => !isNaN(id))
                handleInputChange("supportedChains", chainIds)
              }}
              placeholder="1, 137, 42161"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsExpanded(false)}>
              取消
            </Button>
            <Button onClick={handleUpdate}>保存更改</Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
