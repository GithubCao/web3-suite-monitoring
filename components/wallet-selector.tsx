"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { Wallet, Plus, Trash2, RefreshCw, CheckCircle, XCircle, AlertCircle, ExternalLink } from "lucide-react"
import { getWallets, addWallet, removeWallet, type WalletInfo } from "@/lib/wallet-manager"

// 模拟 Ant Design Web3 组件
interface MockConnectorProps {
  onConnect: (wallet: WalletInfo) => void
  onDisconnect: () => void
}

const MockWeb3Connector = ({ onConnect, onDisconnect }: MockConnectorProps) => {
  const [connecting, setConnecting] = useState(false)

  const mockWallets = [
    { name: "MetaMask", id: "metamask" },
    { name: "WalletConnect", id: "walletconnect" },
    { name: "Coinbase Wallet", id: "coinbase" },
    { name: "Trust Wallet", id: "trust" },
  ]

  const handleConnect = async (walletId: string, walletName: string) => {
    setConnecting(true)

    try {
      // 模拟连接延迟
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // 模拟连接成功
      const mockWallet: WalletInfo = {
        id: walletId,
        name: walletName,
        address: `0x${Math.random().toString(16).substring(2, 42)}`,
        chainId: 1,
        balance: (Math.random() * 10).toFixed(4),
        connected: true,
      }

      onConnect(mockWallet)
    } catch (error) {
      console.error("连接失败:", error)
    } finally {
      setConnecting(false)
    }
  }

  return (
    <div className="space-y-2">
      {mockWallets.map((wallet) => (
        <Button
          key={wallet.id}
          variant="outline"
          className="w-full justify-start"
          onClick={() => handleConnect(wallet.id, wallet.name)}
          disabled={connecting}
        >
          <Wallet className="mr-2 h-4 w-4" />
          {connecting ? "连接中..." : `连接 ${wallet.name}`}
        </Button>
      ))}
    </div>
  )
}

interface WalletSelectorProps {
  selectedWallet?: string
  onWalletSelect: (walletAddress: string) => void
  showAddWallet?: boolean
}

export function WalletSelector({ selectedWallet, onWalletSelect, showAddWallet = true }: WalletSelectorProps) {
  const [wallets, setWallets] = useState<WalletInfo[]>([])
  const [showConnector, setShowConnector] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  // 加载钱包列表
  useEffect(() => {
    loadWallets()
  }, [])

  const loadWallets = () => {
    const savedWallets = getWallets()
    setWallets(savedWallets)
  }

  // 连接新钱包
  const handleWalletConnect = (wallet: WalletInfo) => {
    addWallet(wallet)
    loadWallets()
    setShowConnector(false)

    toast({
      title: "钱包已连接",
      description: `已成功连接 ${wallet.name} (${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)})`,
    })

    // 自动选择新连接的钱包
    onWalletSelect(wallet.address)
  }

  // 断开钱包连接
  const handleWalletDisconnect = (address: string) => {
    removeWallet(address)
    loadWallets()

    // 如果断开的是当前选择的钱包，清除选择
    if (selectedWallet === address) {
      onWalletSelect("")
    }

    toast({
      title: "钱包已断开",
      description: "钱包连接已断开",
    })
  }

  // 刷新钱包状态
  const handleRefreshWallets = async () => {
    setRefreshing(true)

    try {
      // 模拟刷新延迟
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // 更新钱包余额等信息
      const updatedWallets = wallets.map((wallet) => ({
        ...wallet,
        balance: (Math.random() * 10).toFixed(4),
        connected: Math.random() > 0.1, // 90% 概率保持连接
      }))

      updatedWallets.forEach((wallet) => {
        addWallet(wallet)
      })

      loadWallets()

      toast({
        title: "钱包状态已刷新",
        description: "已更新所有钱包的余额和连接状态",
      })
    } catch (error) {
      toast({
        title: "刷新失败",
        description: "无法刷新钱包状态",
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
    }
  }

  // 获取钱包状态图标
  const getWalletStatusIcon = (wallet: WalletInfo) => {
    if (wallet.connected) {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    } else {
      return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  // 获取选中的钱包信息
  const selectedWalletInfo = wallets.find((w) => w.address === selectedWallet)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                钱包选择
              </CardTitle>
              <CardDescription>选择用于自动交易的钱包地址</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRefreshWallets} disabled={refreshing}>
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                刷新
              </Button>
              {showAddWallet && (
                <Button variant="outline" size="sm" onClick={() => setShowConnector(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  添加钱包
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {wallets.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Wallet className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>暂无连接的钱包</p>
              <p className="text-sm">点击"添加钱包"开始连接</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">选择钱包</label>
                <Select value={selectedWallet} onValueChange={onWalletSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择用于交易的钱包" />
                  </SelectTrigger>
                  <SelectContent>
                    {wallets.map((wallet) => (
                      <SelectItem key={wallet.address} value={wallet.address}>
                        <div className="flex items-center gap-2">
                          {getWalletStatusIcon(wallet)}
                          <span>{wallet.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedWalletInfo && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">选中的钱包</h4>
                    <div className="flex items-center gap-2">
                      {getWalletStatusIcon(selectedWalletInfo)}
                      <Badge variant={selectedWalletInfo.connected ? "default" : "secondary"}>
                        {selectedWalletInfo.connected ? "已连接" : "未连接"}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">钱包名称:</span>
                      <span>{selectedWalletInfo.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">地址:</span>
                      <span className="font-mono">
                        {selectedWalletInfo.address.slice(0, 6)}...{selectedWalletInfo.address.slice(-4)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">余额:</span>
                      <span>{selectedWalletInfo.balance} ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">网络:</span>
                      <span>Chain {selectedWalletInfo.chainId}</span>
                    </div>
                  </div>

                  <Separator className="my-3" />

                  <div className="flex justify-between items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open(`https://etherscan.io/address/${selectedWalletInfo.address}`, "_blank")
                      }
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      查看详情
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleWalletDisconnect(selectedWalletInfo.address)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      断开连接
                    </Button>
                  </div>
                </div>
              )}

              {!selectedWallet && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800">请选择钱包</h4>
                      <p className="text-sm text-yellow-700 mt-1">需要选择一个钱包才能启用自动交易功能</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 钱包连接对话框 */}
      {showConnector && (
        <Card>
          <CardHeader>
            <CardTitle>连接钱包</CardTitle>
            <CardDescription>选择要连接的钱包类型</CardDescription>
          </CardHeader>
          <CardContent>
            <MockWeb3Connector onConnect={handleWalletConnect} onDisconnect={() => setShowConnector(false)} />
            <div className="mt-4">
              <Button variant="outline" className="w-full" onClick={() => setShowConnector(false)}>
                取消
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
