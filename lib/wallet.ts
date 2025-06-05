// 钱包状态接口
export interface WalletState {
  connected: boolean
  address: string
  chainId: number
  balance: string
  networkName: string
}

// 网络信息接口
export interface NetworkInfo {
  chainId: number
  name: string
  symbol: string
  rpcUrl: string
  blockExplorerUrl: string
}

// 连接结果接口
export interface WalletResult {
  success: boolean
  walletState?: WalletState
  error?: string
}

// 网络操作结果接口
export interface NetworkResult {
  success: boolean
  error?: string
}

// 声明 window.ethereum 类型
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>
      on: (event: string, callback: (...args: any[]) => void) => void
      removeListener: (event: string, callback: (...args: any[]) => void) => void
      isMetaMask?: boolean
    }
  }
}

// 网络配置映射
const NETWORK_CONFIG: Record<number, NetworkInfo> = {
  1: {
    chainId: 1,
    name: "Ethereum",
    symbol: "ETH",
    rpcUrl: "https://mainnet.infura.io/v3/YOUR_INFURA_KEY",
    blockExplorerUrl: "https://etherscan.io",
  },
  56: {
    chainId: 56,
    name: "BSC",
    symbol: "BNB",
    rpcUrl: "https://bsc-dataseed.binance.org",
    blockExplorerUrl: "https://bscscan.com",
  },
  137: {
    chainId: 137,
    name: "Polygon",
    symbol: "MATIC",
    rpcUrl: "https://polygon-rpc.com",
    blockExplorerUrl: "https://polygonscan.com",
  },
  42161: {
    chainId: 42161,
    name: "Arbitrum",
    symbol: "ETH",
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    blockExplorerUrl: "https://arbiscan.io",
  },
  10: {
    chainId: 10,
    name: "Optimism",
    symbol: "ETH",
    rpcUrl: "https://mainnet.optimism.io",
    blockExplorerUrl: "https://optimistic.etherscan.io",
  },
  8453: {
    chainId: 8453,
    name: "Base",
    symbol: "ETH",
    rpcUrl: "https://mainnet.base.org",
    blockExplorerUrl: "https://basescan.org",
  },
}

// 检查是否安装了钱包
export function isWalletInstalled(): boolean {
  return typeof window !== "undefined" && !!window.ethereum
}

// 获取当前钱包状态
export async function getWalletState(): Promise<WalletState> {
  if (!isWalletInstalled()) {
    return {
      connected: false,
      address: "",
      chainId: 0,
      balance: "0",
      networkName: "",
    }
  }

  try {
    // 检查是否已连接
    const accounts = await window.ethereum!.request({
      method: "eth_accounts",
    })

    if (accounts.length === 0) {
      return {
        connected: false,
        address: "",
        chainId: 0,
        balance: "0",
        networkName: "",
      }
    }

    // 获取链ID
    const chainId = await window.ethereum!.request({
      method: "eth_chainId",
    })

    // 获取余额
    const balance = await window.ethereum!.request({
      method: "eth_getBalance",
      params: [accounts[0], "latest"],
    })

    // 转换余额从 wei 到 ether
    const balanceInEther = (Number.parseInt(balance, 16) / Math.pow(10, 18)).toString()

    // 获取网络名称
    const networkName = NETWORK_CONFIG[Number.parseInt(chainId, 16)]?.name || `Chain ${Number.parseInt(chainId, 16)}`

    return {
      connected: true,
      address: accounts[0],
      chainId: Number.parseInt(chainId, 16),
      balance: balanceInEther,
      networkName,
    }
  } catch (error) {
    console.error("获取钱包状态失败:", error)
    return {
      connected: false,
      address: "",
      chainId: 0,
      balance: "0",
      networkName: "",
    }
  }
}

// 连接钱包
export async function connectWallet(): Promise<WalletResult> {
  if (!isWalletInstalled()) {
    return {
      success: false,
      error: "未检测到钱包，请安装 MetaMask",
    }
  }

  try {
    // 请求连接钱包
    const accounts = await window.ethereum!.request({
      method: "eth_requestAccounts",
    })

    if (accounts.length === 0) {
      return {
        success: false,
        error: "用户拒绝连接钱包",
      }
    }

    // 获取完整的钱包状态
    const walletState = await getWalletState()

    // 保存连接状态到本地存储
    localStorage.setItem("walletConnected", "true")
    localStorage.setItem("walletAddress", accounts[0])

    return {
      success: true,
      walletState,
    }
  } catch (error: any) {
    console.error("连接钱包失败:", error)
    return {
      success: false,
      error: error.message || "连接钱包时发生未知错误",
    }
  }
}

// 断开钱包连接
export async function disconnectWallet(): Promise<void> {
  // 清除本地存储
  localStorage.removeItem("walletConnected")
  localStorage.removeItem("walletAddress")
}

// 切换网络
export async function switchNetwork(chainId: number): Promise<NetworkResult> {
  if (!isWalletInstalled()) {
    return {
      success: false,
      error: "未检测到钱包",
    }
  }

  try {
    await window.ethereum!.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${chainId.toString(16)}` }],
    })

    return {
      success: true,
    }
  } catch (error: any) {
    console.error("切换网络失败:", error)
    return {
      success: false,
      error: error.message || "切换网络时发生未知错误",
    }
  }
}

// 添加网络
export async function addNetwork(network: NetworkInfo): Promise<NetworkResult> {
  if (!isWalletInstalled()) {
    return {
      success: false,
      error: "未检测到钱包",
    }
  }

  try {
    await window.ethereum!.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: `0x${network.chainId.toString(16)}`,
          chainName: network.name,
          nativeCurrency: {
            name: network.symbol,
            symbol: network.symbol,
            decimals: 18,
          },
          rpcUrls: [network.rpcUrl],
          blockExplorerUrls: [network.blockExplorerUrl],
        },
      ],
    })

    return {
      success: true,
    }
  } catch (error: any) {
    console.error("添加网络失败:", error)
    return {
      success: false,
      error: error.message || "添加网络时发生未知错误",
    }
  }
}

// 获取网络信息
export function getNetworkInfo(chainId: number): NetworkInfo | null {
  return NETWORK_CONFIG[chainId] || null
}

// 获取所有支持的网络
export function getSupportedNetworks(): NetworkInfo[] {
  return Object.values(NETWORK_CONFIG)
}

// 格式化地址显示
export function formatAddress(address: string, startLength = 6, endLength = 4): string {
  if (!address) return ""
  if (address.length <= startLength + endLength) return address
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`
}

// 格式化余额显示
export function formatBalance(balance: string, decimals = 4): string {
  const num = Number.parseFloat(balance)
  if (isNaN(num)) return "0"
  return num.toFixed(decimals)
}

// 验证地址格式
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

// 获取区块浏览器链接
export function getExplorerUrl(chainId: number, address: string, type: "address" | "tx" = "address"): string {
  const network = NETWORK_CONFIG[chainId]
  if (!network) return ""

  return `${network.blockExplorerUrl}/${type}/${address}`
}
