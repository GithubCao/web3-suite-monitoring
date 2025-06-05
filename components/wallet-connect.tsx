"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Wallet, LogOut, Copy, ExternalLink, Check, Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { connectWallet, disconnectWallet, getWalletState, switchNetwork, addNetwork } from "@/lib/wallet"
import type { WalletState, NetworkInfo } from "@/lib/wallet"

export function WalletConnect() {
  const [walletState, setWalletState] = useState<WalletState>({
    connected: false,
    address: "",
    chainId: 0,
    balance: "0",
    networkName: "",
  })
  const [copied, setCopied] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [switching, setSwitching] = useState(false)
  const { toast } = useToast()

  // 检查钱包状态
  useEffect(() => {
    const checkWalletState = async () => {
      const state = await getWalletState()
      setWalletState(state)
    }

    checkWalletState()

    // 监听账户变化
    if (typeof window !== "undefined" && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          setWalletState({
            connected: false,
            address: "",
            chainId: 0,
            balance: "0",
            networkName: "",
          })
        } else {
          checkWalletState()
        }
      }

      const handleChainChanged = () => {
        checkWalletState()
      }

      window.ethereum.on("accountsChanged", handleAccountsChanged)
      window.ethereum.on("chainChanged", handleChainChanged)

      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
        window.ethereum.removeListener("chainChanged", handleChainChanged)
      }
    }
  }, [])

  // 连接钱包
  const handleConnectWallet = async () => {
    setConnecting(true)

    try {
      const result = await connectWallet()

      if (result.success && result.walletState) {
        setWalletState(result.walletState)
        toast({
          title: "钱包已连接",
          description: `已成功连接到地址 ${result.walletState.address}`,
        })
      } else {
        toast({
          title: "连接失败",
          description: result.error || "无法连接到钱包",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "连接失败",
        description: error instanceof Error ? error.message : "连接钱包时发生错误",
        variant: "destructive",
      })
    } finally {
      setConnecting(false)
    }
  }

  // 断开钱包连接
  const handleDisconnectWallet = async () => {
    try {
      await disconnectWallet()
      setWalletState({
        connected: false,
        address: "",
        chainId: 0,
        balance: "0",
        networkName: "",
      })

      toast({
        title: "钱包已断开",
        description: "已成功断开钱包连接",
      })
    } catch (error) {
      toast({
        title: "断开失败",
        description: error instanceof Error ? error.message : "断开钱包时发生错误",
        variant: "destructive",
      })
    }
  }

  // 切换网络
  const handleSwitchNetwork = async (network: NetworkInfo) => {
    setSwitching(true)

    try {
      const result = await switchNetwork(network.chainId)

      if (result.success) {
        // 更新钱包状态
        const newState = await getWalletState()
        setWalletState(newState)

        toast({
          title: "网络切换成功",
          description: `已切换到 ${network.name}`,
        })
      } else {
        // 如果切换失败，尝试添加网络
        if (result.error?.includes("Unrecognized chain ID")) {
          const addResult = await addNetwork(network)
          if (addResult.success) {
            const newState = await getWalletState()
            setWalletState(newState)
            toast({
              title: "网络添加成功",
              description: `已添加并切换到 ${network.name}`,
            })
          } else {
            toast({
              title: "网络添加失败",
              description: addResult.error || "无法添加网络",
              variant: "destructive",
            })
          }
        } else {
          toast({
            title: "网络切换失败",
            description: result.error || "无法切换网络",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      toast({
        title: "网络切换失败",
        description: error instanceof Error ? error.message : "切换网络时发生错误",
        variant: "destructive",
      })
    } finally {
      setSwitching(false)
    }
  }

  // 复制地址到剪贴板
  const copyAddress = () => {
    if (walletState.address) {
      navigator.clipboard.writeText(walletState.address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)

      toast({
        title: "已复制",
        description: "钱包地址已复制到剪贴板",
      })
    }
  }

  // 在区块浏览器中查看
  const viewInExplorer = () => {
    if (walletState.address && walletState.chainId) {
      const explorerUrls: Record<number, string> = {
        1: "https://etherscan.io",
        56: "https://bscscan.com",
        137: "https://polygonscan.com",
        42161: "https://arbiscan.io",
        10: "https://optimistic.etherscan.io",
        8453: "https://basescan.org",
      }

      const explorerUrl = explorerUrls[walletState.chainId]
      if (explorerUrl) {
        window.open(`${explorerUrl}/address/${walletState.address}`, "_blank")
      }
    }
  }

  // 支持的网络列表
  const supportedNetworks: NetworkInfo[] = [
    {
      chainId: 1,
      name: "Ethereum",
      symbol: "ETH",
      rpcUrl: "https://mainnet.infura.io/v3/YOUR_INFURA_KEY",
      blockExplorerUrl: "https://etherscan.io",
    },
    {
      chainId: 56,
      name: "BSC",
      symbol: "BNB",
      rpcUrl: "https://bsc-dataseed.binance.org",
      blockExplorerUrl: "https://bscscan.com",
    },
    {
      chainId: 137,
      name: "Polygon",
      symbol: "MATIC",
      rpcUrl: "https://polygon-rpc.com",
      blockExplorerUrl: "https://polygonscan.com",
    },
    {
      chainId: 42161,
      name: "Arbitrum",
      symbol: "ETH",
      rpcUrl: "https://arb1.arbitrum.io/rpc",
      blockExplorerUrl: "https://arbiscan.io",
    },
    {
      chainId: 10,
      name: "Optimism",
      symbol: "ETH",
      rpcUrl: "https://mainnet.optimism.io",
      blockExplorerUrl: "https://optimistic.etherscan.io",
    },
    {
      chainId: 8453,
      name: "Base",
      symbol: "ETH",
      rpcUrl: "https://mainnet.base.org",
      blockExplorerUrl: "https://basescan.org",
    },
  ]

  // 检查是否安装了钱包
  const isWalletInstalled = typeof window !== "undefined" && window.ethereum

  if (!isWalletInstalled) {
    return (
      <Button variant="outline" onClick={() => window.open("https://metamask.io/download/", "_blank")}>
        <AlertCircle className="mr-2 h-4 w-4" />
        安装 MetaMask
      </Button>
    )
  }

  return (
    <div>
      {walletState.connected ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              <span className="hidden md:inline">
                {walletState.address.slice(0, 6)}...{walletState.address.slice(-4)}
              </span>
              <Badge variant="outline" className="ml-1 bg-green-100 text-green-800">
                {walletState.networkName || `Chain ${walletState.chainId}`}
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>钱包信息</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex justify-between">
              <span>地址</span>
              <span className="text-xs text-muted-foreground">
                {walletState.address.slice(0, 6)}...{walletState.address.slice(-4)}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex justify-between">
              <span>余额</span>
              <span>
                {Number.parseFloat(walletState.balance).toFixed(4)}{" "}
                {walletState.networkName?.includes("ETH") ? "ETH" : ""}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex justify-between">
              <span>网络</span>
              <span>{walletState.networkName || `Chain ${walletState.chainId}`}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={copyAddress}>
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              复制地址
            </DropdownMenuItem>
            <DropdownMenuItem onClick={viewInExplorer}>
              <ExternalLink className="mr-2 h-4 w-4" />
              在区块浏览器中查看
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>切换网络</DropdownMenuLabel>
            {supportedNetworks.map((network) => (
              <DropdownMenuItem
                key={network.chainId}
                onClick={() => handleSwitchNetwork(network)}
                disabled={switching || walletState.chainId === network.chainId}
                className={walletState.chainId === network.chainId ? "bg-green-50" : ""}
              >
                {switching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <div className="mr-2 h-4 w-4" />}
                {network.name}
                {walletState.chainId === network.chainId && <Check className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDisconnectWallet} className="text-red-500">
              <LogOut className="mr-2 h-4 w-4" />
              断开连接
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button onClick={handleConnectWallet} disabled={connecting}>
          {connecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              连接中...
            </>
          ) : (
            <>
              <Wallet className="mr-2 h-4 w-4" />
              连接钱包
            </>
          )}
        </Button>
      )}
    </div>
  )
}
