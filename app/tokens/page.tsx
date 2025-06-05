"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  fetchKyberSwapChains,
  fetchTokensFromKyberSwap,
  updateTokensForChain,
  getCachedTokensForChain,
  type KyberSwapChain,
} from "@/lib/config"
import type { TokenDetail } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle } from "lucide-react"

export default function TokensPage() {
  const [chains, setChains] = useState<KyberSwapChain[]>([])
  const [selectedChain, setSelectedChain] = useState<string>("1") // 默认以太坊
  const [tokens, setTokens] = useState<TokenDetail[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchingTokens, setFetchingTokens] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const tokensPerPage = 20

  // 新增代币相关状态
  const [newTokenDialogOpen, setNewTokenDialogOpen] = useState(false)
  const [newToken, setNewToken] = useState<Partial<TokenDetail>>({
    chainId: 0,
    symbol: "",
    name: "",
    address: "",
    decimals: 18,
    logoURI: "",
  })

  // 新增网络相关状态
  const [newChainDialogOpen, setNewChainDialogOpen] = useState(false)
  const [newChain, setNewChain] = useState<Partial<KyberSwapChain>>({
    chainId: "",
    chainName: "",
    displayName: "",
    logoUrl: "",
  })

  const [filteredTokens, setFilteredTokens] = useState<TokenDetail[]>([])
  const [selectedToken, setSelectedToken] = useState<TokenDetail | null>(null)
  const [deleteTokenDialogOpen, setDeleteTokenDialogOpen] = useState(false)

  // 删除网络相关状态
  const [deleteChainDialogOpen, setDeleteChainDialogOpen] = useState(false)
  const [selectedChainToDelete, setSelectedChainToDelete] = useState<KyberSwapChain | null>(null)

  useEffect(() => {
    const loadChains = async () => {
      try {
        setLoading(true)
        const fetchedChains = await fetchKyberSwapChains()
        setChains(fetchedChains)

        // 加载第一个链的缓存代币
        if (fetchedChains.length > 0) {
          const firstChain = fetchedChains[0]
          setSelectedChain(firstChain.chainId)
          loadCachedTokens(firstChain.chainId)
        }
      } catch (error) {
        console.error("加载网络信息失败:", error)
        setMessage("加载网络信息失败")
        setMessageType("error")
      } finally {
        setLoading(false)
      }
    }

    loadChains()
  }, [])

  useEffect(() => {
    // 当选择链变化时，更新新代币的chainId
    if (selectedChain) {
      setNewToken((prev) => ({
        ...prev,
        chainId: Number(selectedChain),
      }))
    }
  }, [selectedChain])

  const loadCachedTokens = (chainId: string) => {
    const cachedTokens = getCachedTokensForChain(chainId)
    setTokens(cachedTokens)
    setCurrentPage(1)

    if (cachedTokens.length > 0) {
      setMessage(`已加载 ${cachedTokens.length} 个缓存代币`)
      setMessageType("info")
    } else {
      setMessage('未找到缓存代币数据，请点击"获取代币数据"按钮')
      setMessageType("info")
    }
  }

  const handleChainSelect = (chainId: string) => {
    setSelectedChain(chainId)
    loadCachedTokens(chainId)
  }

  const handleFetchTokens = async () => {
    try {
      setFetchingTokens(true)
      setMessage("正在获取代币数据...")
      setMessageType("info")

      const chainId = Number(selectedChain)
      const fetchedTokens = await fetchTokensFromKyberSwap(chainId)

      if (fetchedTokens.length === 0) {
        setMessage("未找到代币数据")
        setMessageType("error")
        return
      }

      setTokens(fetchedTokens)
      setMessage(`成功获取 ${fetchedTokens.length} 个代币数据`)
      setMessageType("success")
      setCurrentPage(1)
    } catch (error) {
      console.error("获取代币数据失败:", error)
      setMessage(`获取代币数据失败: ${error instanceof Error ? error.message : "未知错误"}`)
      setMessageType("error")
    } finally {
      setFetchingTokens(false)
    }
  }

  const handleUpdateConfig = async () => {
    try {
      if (tokens.length === 0) {
        setMessage("没有代币数据可更新")
        setMessageType("error")
        return
      }

      setMessage("正在更新配置...")
      setMessageType("info")

      const chainId = Number(selectedChain)
      updateTokensForChain(chainId, tokens)

      // 强制刷新全局配置缓存
      const { forceRefreshConfig } = require("@/lib/config")
      forceRefreshConfig()

      setMessage("代币配置已成功更新并同步到策略配置")
      setMessageType("success")
    } catch (error) {
      console.error("更新配置失败:", error)
      setMessage(`更新配置失败: ${error instanceof Error ? error.message : "未知错误"}`)
      setMessageType("error")
    }
  }

  // 处理新增代币
  const handleAddToken = () => {
    // 验证必填字段
    if (!newToken.symbol || !newToken.address || !newToken.name) {
      setMessage("请填写代币的符号、名称和地址")
      setMessageType("error")
      return
    }

    try {
      // 检查代币是否已存在
      const existingToken = tokens.find(
        (t) =>
          t.address.toLowerCase() === newToken.address?.toLowerCase() ||
          t.symbol.toLowerCase() === newToken.symbol?.toLowerCase(),
      )

      if (existingToken) {
        setMessage(`代币已存在: ${existingToken.symbol}`)
        setMessageType("error")
        return
      }

      // 创建新代币对象
      const tokenToAdd: TokenDetail = {
        chainId: Number(selectedChain),
        symbol: newToken.symbol || "",
        name: newToken.name || "",
        address: newToken.address || "",
        decimals: newToken.decimals || 18,
        logoURI: newToken.logoURI,
      }

      // 添加到代币列表
      const updatedTokens = [...tokens, tokenToAdd]
      setTokens(updatedTokens)

      // 更新配置
      updateTokensForChain(Number(selectedChain), updatedTokens)

      // 强制刷新全局配置缓存
      const { forceRefreshConfig } = require("@/lib/config")
      forceRefreshConfig()

      // 重置表单并关闭对话框
      setNewToken({
        chainId: Number(selectedChain),
        symbol: "",
        name: "",
        address: "",
        decimals: 18,
        logoURI: "",
      })
      setNewTokenDialogOpen(false)

      // 显示成功消息
      setMessage(`成功添加代币: ${tokenToAdd.symbol}，配置已同步更新`)
      setMessageType("success")
    } catch (error) {
      console.error("添加代币失败:", error)
      setMessage(`添加代币失败: ${error instanceof Error ? error.message : "未知错误"}`)
      setMessageType("error")
    }
  }

  // 处理新增网络
  const handleAddChain = () => {
    // 验证必填字段
    if (!newChain.chainId || !newChain.displayName) {
      setMessage("请填写链ID和显示名称")
      setMessageType("error")
      return
    }

    try {
      // 检查链是否已存在
      const existingChain = chains.find((c) => c.chainId === newChain.chainId)

      if (existingChain) {
        setMessage(`链已存在: ${existingChain.displayName}`)
        setMessageType("error")
        return
      }

      // 创建新链对象
      const chainToAdd: KyberSwapChain = {
        chainId: newChain.chainId || "",
        chainName: newChain.chainName || newChain.displayName || "",
        displayName: newChain.displayName || "",
        logoUrl: newChain.logoUrl || "",
      }

      // 添加到链列表
      const updatedChains = [...chains, chainToAdd]
      setChains(updatedChains)

      // 保存到本地存储
      if (typeof window !== "undefined") {
        localStorage.setItem("kyberswap-chains", JSON.stringify(updatedChains))
      }

      // 重置表单并关闭对话框
      setNewChain({
        chainId: "",
        chainName: "",
        displayName: "",
        logoUrl: "",
      })
      setNewChainDialogOpen(false)

      // 显示成功消息
      setMessage(`成功添加网络: ${chainToAdd.displayName}`)
      setMessageType("success")
    } catch (error) {
      console.error("添加网络失败:", error)
      setMessage(`添加网络失败: ${error instanceof Error ? error.message : "未知错误"}`)
      setMessageType("error")
    }
  }

  // 搜索和分页
  useEffect(() => {
    const filtered = tokens.filter(
      (token) =>
        token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.address.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    setFilteredTokens(filtered)
    setCurrentPage(1)
  }, [tokens, searchQuery])

  const totalPages = Math.ceil(filteredTokens.length / tokensPerPage)
  const paginatedTokens = filteredTokens.slice((currentPage - 1) * tokensPerPage, currentPage * tokensPerPage)

  const getSelectedChainName = () => {
    const chain = chains.find((c) => c.chainId === selectedChain)
    return chain ? chain.displayName : `Chain ID: ${selectedChain}`
  }

  // 处理删除代币
  const handleDeleteToken = () => {
    if (!selectedToken) return

    try {
      // 从代币列表中移除
      const updatedTokens = tokens.filter(
        (token) => token.address.toLowerCase() !== selectedToken.address.toLowerCase(),
      )

      setTokens(updatedTokens)

      // 更新配置
      updateTokensForChain(Number(selectedChain), updatedTokens)

      // 强制刷新全局配置缓存
      const { forceRefreshConfig } = require("@/lib/config")
      forceRefreshConfig()

      // 关闭对话框
      setDeleteTokenDialogOpen(false)
      setSelectedToken(null)

      // 显示成功消息
      setMessage(`成功删除代币: ${selectedToken.symbol}，配置已同步更新`)
      setMessageType("success")
    } catch (error) {
      console.error("删除代币失败:", error)
      setMessage(`删除代币失败: ${error instanceof Error ? error.message : "未知错误"}`)
      setMessageType("error")
    }
  }

  // 处理删除网络
  const handleDeleteChain = () => {
    if (!selectedChainToDelete) return

    try {
      // 从链列表中移除
      const updatedChains = chains.filter((chain) => chain.chainId !== selectedChainToDelete.chainId)

      setChains(updatedChains)

      // 保存到本地存储
      if (typeof window !== "undefined") {
        localStorage.setItem("kyberswap-chains", JSON.stringify(updatedChains))
      }

      // 重置表单并关闭对话框
      setDeleteChainDialogOpen(false)
      setSelectedChainToDelete(null)

      // 显示成功消息
      setMessage(`成功删除网络: ${selectedChainToDelete.displayName}`)
      setMessageType("success")
    } catch (error) {
      console.error("删除网络失败:", error)
      setMessage(`删除网络失败: ${error instanceof Error ? error.message : "未知错误"}`)
      setMessageType("error")
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">代币管理</h1>

      {message && (
        <div
          className={`mb-6 p-4 rounded ${
            messageType === "success"
              ? "bg-green-100 text-green-800"
              : messageType === "error"
                ? "bg-red-100 text-red-800"
                : "bg-blue-100 text-blue-800"
          }`}
        >
          {message}
        </div>
      )}

      <Tabs defaultValue="tokens" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tokens">代币数据</TabsTrigger>
          <TabsTrigger value="networks">网络信息</TabsTrigger>
        </TabsList>

        <TabsContent value="tokens" className="space-y-4 mt-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
              <div className="w-full md:w-1/3">
                <label className="block text-sm font-medium text-gray-700 mb-1">选择网络</label>
                <select
                  value={selectedChain}
                  onChange={(e) => handleChainSelect(e.target.value)}
                  disabled={loading}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  {loading ? (
                    <option>加载中...</option>
                  ) : (
                    chains.map((chain) => (
                      <option key={chain.chainId} value={chain.chainId}>
                        {chain.displayName}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="flex gap-2 w-full md:w-auto">
                <Button
                  onClick={handleFetchTokens}
                  disabled={fetchingTokens || loading}
                  className="flex-1 md:flex-none"
                >
                  {fetchingTokens ? "获取中..." : "获取代币数据"}
                </Button>
                <Button
                  onClick={handleUpdateConfig}
                  disabled={fetchingTokens || tokens.length === 0}
                  variant="outline"
                  className="flex-1 md:flex-none"
                >
                  更新配置
                </Button>
                <Dialog open={newTokenDialogOpen} onOpenChange={setNewTokenDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex-1 md:flex-none">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      新增代币
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>新增代币</DialogTitle>
                      <DialogDescription>为当前选择的网络 ({getSelectedChainName()}) 添加新代币</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="symbol" className="text-right">
                          代币符号*
                        </Label>
                        <Input
                          id="symbol"
                          value={newToken.symbol}
                          onChange={(e) => setNewToken({ ...newToken, symbol: e.target.value })}
                          className="col-span-3"
                          placeholder="例如: ETH"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                          代币名称*
                        </Label>
                        <Input
                          id="name"
                          value={newToken.name}
                          onChange={(e) => setNewToken({ ...newToken, name: e.target.value })}
                          className="col-span-3"
                          placeholder="例如: Ethereum"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="address" className="text-right">
                          合约地址*
                        </Label>
                        <Input
                          id="address"
                          value={newToken.address}
                          onChange={(e) => setNewToken({ ...newToken, address: e.target.value })}
                          className="col-span-3"
                          placeholder="0x..."
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="decimals" className="text-right">
                          小数位数
                        </Label>
                        <Input
                          id="decimals"
                          type="number"
                          value={newToken.decimals}
                          onChange={(e) => setNewToken({ ...newToken, decimals: Number.parseInt(e.target.value) })}
                          className="col-span-3"
                          placeholder="18"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="logoURI" className="text-right">
                          Logo URL
                        </Label>
                        <Input
                          id="logoURI"
                          value={newToken.logoURI}
                          onChange={(e) => setNewToken({ ...newToken, logoURI: e.target.value })}
                          className="col-span-3"
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setNewTokenDialogOpen(false)}>
                        取消
                      </Button>
                      <Button onClick={handleAddToken}>添加</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="mb-4">
              <Input
                placeholder="搜索代币符号、名称或地址..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="mb-2 flex justify-between items-center">
              <h3 className="text-lg font-semibold">{getSelectedChainName()} 代币列表</h3>
              <span className="text-sm text-gray-500">共 {filteredTokens.length} 个代币</span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      图标
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      符号
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      名称
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      小数位
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      地址
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedTokens.map((token) => (
                    <tr key={token.address} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {token.logoURI ? (
                          <img
                            src={token.logoURI || "/placeholder.svg"}
                            alt={token.symbol}
                            className="w-6 h-6 rounded-full"
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).style.display = "none"
                            }}
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-xs">{token.symbol.substring(0, 2)}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{token.symbol}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{token.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{token.decimals}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                        <span className="truncate block max-w-xs">{token.address}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            setSelectedToken(token)
                            setDeleteTokenDialogOpen(true)
                          }}
                        >
                          删除
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 删除代币对话框 */}
            <Dialog open={deleteTokenDialogOpen} onOpenChange={setDeleteTokenDialogOpen}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>删除代币</DialogTitle>
                  <DialogDescription>确定要删除此代币吗？此操作无法撤销。</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  {selectedToken && (
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <span className="font-medium">代币符号:</span>
                        <span className="ml-2">{selectedToken.symbol}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium">代币名称:</span>
                        <span className="ml-2">{selectedToken.name}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium">合约地址:</span>
                        <span className="ml-2 text-sm font-mono truncate">{selectedToken.address}</span>
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteTokenDialogOpen(false)}>
                    取消
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteToken}>
                    删除
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {filteredTokens.length > 0 && (
              <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  显示 {(currentPage - 1) * tokensPerPage + 1} -{" "}
                  {Math.min(currentPage * tokensPerPage, filteredTokens.length)} 共 {filteredTokens.length} 个代币
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                  >
                    上一页
                  </Button>
                  <span className="px-2 py-1">
                    {currentPage} / {totalPages || 1}
                  </span>
                  <Button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage >= totalPages}
                    variant="outline"
                    size="sm"
                  >
                    下一页
                  </Button>
                </div>
              </div>
            )}

            {filteredTokens.length === 0 && !fetchingTokens && (
              <div className="text-center py-10 text-gray-500">
                {searchQuery ? "没有找到匹配的代币" : '暂无代币数据，请点击"获取代币数据"按钮'}
              </div>
            )}

            {fetchingTokens && (
              <div className="text-center py-10">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
                <p className="mt-2 text-gray-600">获取代币数据中...</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="networks" className="space-y-4 mt-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">KyberSwap 支持的网络</h2>
              <div className="flex gap-2">
                <Button
                  onClick={async () => {
                    setLoading(true)
                    try {
                      const refreshedChains = await fetchKyberSwapChains()
                      setChains(refreshedChains)
                      setMessage("网络信息已刷新")
                      setMessageType("success")
                    } catch (error) {
                      setMessage("刷新网络信息失败")
                      setMessageType("error")
                    } finally {
                      setLoading(false)
                    }
                  }}
                  disabled={loading}
                  variant="outline"
                >
                  {loading ? "刷新中..." : "刷新网络信息"}
                </Button>

                <Dialog open={newChainDialogOpen} onOpenChange={setNewChainDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      新增网络
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>新增网络</DialogTitle>
                      <DialogDescription>添加新的区块链网络</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="chainId" className="text-right">
                          链ID*
                        </Label>
                        <Input
                          id="chainId"
                          value={newChain.chainId}
                          onChange={(e) => setNewChain({ ...newChain, chainId: e.target.value })}
                          className="col-span-3"
                          placeholder="例如: 1"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="displayName" className="text-right">
                          显示名称*
                        </Label>
                        <Input
                          id="displayName"
                          value={newChain.displayName}
                          onChange={(e) => setNewChain({ ...newChain, displayName: e.target.value })}
                          className="col-span-3"
                          placeholder="例如: Ethereum"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="chainName" className="text-right">
                          链名称
                        </Label>
                        <Input
                          id="chainName"
                          value={newChain.chainName}
                          onChange={(e) => setNewChain({ ...newChain, chainName: e.target.value })}
                          className="col-span-3"
                          placeholder="例如: ethereum"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="logoUrl" className="text-right">
                          Logo URL
                        </Label>
                        <Input
                          id="logoUrl"
                          value={newChain.logoUrl}
                          onChange={(e) => setNewChain({ ...newChain, logoUrl: e.target.value })}
                          className="col-span-3"
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setNewChainDialogOpen(false)}>
                        取消
                      </Button>
                      <Button onClick={handleAddChain}>添加</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-10">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
                <p className="mt-2 text-gray-600">加载网络信息中...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {chains.map((chain) => (
                  <Card key={chain.chainId} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-4">
                        {chain.logoUrl && (
                          <div className="w-10 h-10 flex-shrink-0">
                            <img
                              src={chain.logoUrl || "/placeholder.svg"}
                              alt={chain.displayName}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                ;(e.target as HTMLImageElement).style.display = "none"
                              }}
                            />
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-lg">{chain.displayName}</CardTitle>
                          <CardDescription>Chain ID: {chain.chainId}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>内部名称:</span>
                          <span className="font-mono">{chain.chainName}</span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span>代币数量:</span>
                          <span>{getCachedTokensForChain(chain.chainId).length}</span>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedChain(chain.chainId)
                            loadCachedTokens(chain.chainId)
                            // 切换到代币选项卡
                            document
                              .querySelector('[data-value="tokens"]')
                              ?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
                          }}
                        >
                          查看代币
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            setSelectedChainToDelete(chain)
                            setDeleteChainDialogOpen(true)
                          }}
                        >
                          删除
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {chains.length === 0 && !loading && <div className="text-center py-10 text-gray-500">未找到网络信息</div>}
          </div>
        </TabsContent>
      </Tabs>

      {/* 删除网络对话框 */}
      <Dialog open={deleteChainDialogOpen} onOpenChange={setDeleteChainDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>删除网络</DialogTitle>
            <DialogDescription>确定要删除此网络吗？此操作将同时删除该网络上的所有代币数据。</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedChainToDelete && (
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="font-medium">网络名称:</span>
                  <span className="ml-2">{selectedChainToDelete.displayName}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium">链ID:</span>
                  <span className="ml-2">{selectedChainToDelete.chainId}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium">代币数量:</span>
                  <span className="ml-2">{getCachedTokensForChain(selectedChainToDelete.chainId).length}</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteChainDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteChain}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
