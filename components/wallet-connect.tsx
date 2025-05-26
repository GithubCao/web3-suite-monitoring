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
import { Wallet, LogOut, Copy, ExternalLink, Check, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"

// 模拟Web3钱包连接
interface WalletState {
  connected: boolean
  address: string
  chainId: number
  balance: string
}

export function WalletConnect() {
  const [walletState, setWalletState] = useState<WalletState>({
    connected: false,
    address: "",
    chainId: 0,
    balance: "0",
  })
  const [copied, setCopied] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const { toast } = useToast()

  // 模拟连接钱包
  const connectWallet = async () => {
    setConnecting(true)

    try {
      // 模拟连接延迟
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // 模拟连接成功
      const mockAddress = `0x${Math.random().toString(16).substring(2, 14)}...${Math.random().toString(16).substring(2, 6)}`
      const mockChainId = 1 // Ethereum Mainnet
      const mockBalance = (Math.random() * 10).toFixed(4)

      setWalletState({
        connected: true,
        address: mockAddress,
        chainId: mockChainId,
        balance: mockBalance,
      })

      toast({
        title: "钱包已连接",
        description: `已成功连接到地址 ${mockAddress}`,
      })

      // 保存到本地存储
      localStorage.setItem("walletConnected", "true")
      localStorage.setItem("walletAddress", mockAddress)
    } catch (error) {
      toast({
        title: "连接失败",
        description: "无法连接到钱包，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setConnecting(false)
    }
  }

  // 断开钱包连接
  const disconnectWallet = () => {
    setWalletState({
      connected: false,
      address: "",
      chainId: 0,
      balance: "0",
    })

    toast({
      title: "钱包已断开",
      description: "已成功断开钱包连接",
    })

    // 清除本地存储
    localStorage.removeItem("walletConnected")
    localStorage.removeItem("walletAddress")
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

  // 检查本地存储中的钱包状态
  useEffect(() => {
    const connected = localStorage.getItem("walletConnected") === "true"
    const address = localStorage.getItem("walletAddress") || ""

    if (connected && address) {
      setWalletState({
        connected: true,
        address,
        chainId: 1,
        balance: (Math.random() * 10).toFixed(4),
      })
    }
  }, [])

  // 获取链名称
  const getChainName = (chainId: number) => {
    switch (chainId) {
      case 1:
        return "Ethereum"
      case 56:
        return "BSC"
      case 137:
        return "Polygon"
      case 42161:
        return "Arbitrum"
      default:
        return "Unknown"
    }
  }

  return (
    <div>
      {walletState.connected ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              <span className="hidden md:inline">{walletState.address}</span>
              <Badge variant="outline" className="ml-1 bg-green-100 text-green-800">
                {getChainName(walletState.chainId)}
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>钱包信息</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex justify-between">
              <span>地址</span>
              <span className="text-xs text-muted-foreground">{walletState.address}</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex justify-between">
              <span>余额</span>
              <span>{walletState.balance} ETH</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex justify-between">
              <span>网络</span>
              <span>{getChainName(walletState.chainId)}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={copyAddress}>
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              复制地址
            </DropdownMenuItem>
            <DropdownMenuItem>
              <ExternalLink className="mr-2 h-4 w-4" />
              在区块浏览器中查看
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={disconnectWallet} className="text-red-500">
              <LogOut className="mr-2 h-4 w-4" />
              断开连接
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button onClick={connectWallet} disabled={connecting}>
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
