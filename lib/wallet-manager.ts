// 钱包管理器
export interface WalletInfo {
  id: string
  name: string
  address: string
  chainId: number
  balance: string
  connected: boolean
  provider?: any
}

export interface WalletTransaction {
  id: string
  walletAddress: string
  strategyId: string
  sourceChain: string
  targetChain: string
  sourceToken: string
  targetToken: string
  amount: string
  status: "pending" | "completed" | "failed"
  txHash?: string
  timestamp: number
  error?: string
}

// 钱包存储键
const WALLETS_KEY = "web3-arbitrage-wallets"
const WALLET_TRANSACTIONS_KEY = "web3-arbitrage-wallet-transactions"

// 保存钱包信息
export const saveWallets = (wallets: WalletInfo[]): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem(WALLETS_KEY, JSON.stringify(wallets))
  }
}

// 获取钱包信息
export const getWallets = (): WalletInfo[] => {
  if (typeof window !== "undefined") {
    const data = localStorage.getItem(WALLETS_KEY)
    if (data) {
      try {
        return JSON.parse(data)
      } catch (error) {
        console.error("Error parsing wallets:", error)
      }
    }
  }
  return []
}

// 添加钱包
export const addWallet = (wallet: WalletInfo): void => {
  const wallets = getWallets()
  const existingIndex = wallets.findIndex((w) => w.address === wallet.address)

  if (existingIndex !== -1) {
    // 更新现有钱包
    wallets[existingIndex] = wallet
  } else {
    // 添加新钱包
    wallets.push(wallet)
  }

  saveWallets(wallets)
}

// 移除钱包
export const removeWallet = (address: string): void => {
  const wallets = getWallets()
  const filteredWallets = wallets.filter((w) => w.address !== address)
  saveWallets(filteredWallets)
}

// 更新钱包状态
export const updateWalletStatus = (address: string, connected: boolean): void => {
  const wallets = getWallets()
  const walletIndex = wallets.findIndex((w) => w.address === address)

  if (walletIndex !== -1) {
    wallets[walletIndex].connected = connected
    saveWallets(wallets)
  }
}

// 获取钱包交易记录
export const getWalletTransactions = (): WalletTransaction[] => {
  if (typeof window !== "undefined") {
    const data = localStorage.getItem(WALLET_TRANSACTIONS_KEY)
    if (data) {
      try {
        return JSON.parse(data)
      } catch (error) {
        console.error("Error parsing wallet transactions:", error)
      }
    }
  }
  return []
}

// 保存钱包交易记录
export const saveWalletTransactions = (transactions: WalletTransaction[]): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem(WALLET_TRANSACTIONS_KEY, JSON.stringify(transactions))
  }
}

// 添加钱包交易记录
export const addWalletTransaction = (transaction: WalletTransaction): void => {
  const transactions = getWalletTransactions()
  transactions.push(transaction)
  saveWalletTransactions(transactions)
}

// 更新钱包交易状态
export const updateWalletTransaction = (id: string, updates: Partial<WalletTransaction>): void => {
  const transactions = getWalletTransactions()
  const index = transactions.findIndex((t) => t.id === id)

  if (index !== -1) {
    transactions[index] = { ...transactions[index], ...updates }
    saveWalletTransactions(transactions)
  }
}

// 执行钱包交易
export const executeWalletTransaction = async (
  wallet: WalletInfo,
  strategyId: string,
  sourceChain: string,
  targetChain: string,
  sourceToken: string,
  targetToken: string,
  amount: string,
): Promise<WalletTransaction> => {
  const transaction: WalletTransaction = {
    id: crypto.randomUUID(),
    walletAddress: wallet.address,
    strategyId,
    sourceChain,
    targetChain,
    sourceToken,
    targetToken,
    amount,
    status: "pending",
    timestamp: Date.now(),
  }

  addWalletTransaction(transaction)

  try {
    // 模拟交易执行
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // 模拟成功/失败
    const isSuccess = Math.random() > 0.2

    if (isSuccess) {
      const txHash = `0x${Math.random().toString(16).substring(2, 66)}`
      updateWalletTransaction(transaction.id, {
        status: "completed",
        txHash,
      })

      return {
        ...transaction,
        status: "completed",
        txHash,
      }
    } else {
      updateWalletTransaction(transaction.id, {
        status: "failed",
        error: "交易执行失败，可能是因为余额不足或网络问题",
      })

      return {
        ...transaction,
        status: "failed",
        error: "交易执行失败，可能是因为余额不足或网络问题",
      }
    }
  } catch (error) {
    updateWalletTransaction(transaction.id, {
      status: "failed",
      error: error instanceof Error ? error.message : "未知错误",
    })

    return {
      ...transaction,
      status: "failed",
      error: error instanceof Error ? error.message : "未知错误",
    }
  }
}
