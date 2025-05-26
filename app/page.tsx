import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, TrendingUp, Wallet, Zap } from "lucide-react"
import { getChainNames, getAllTokenSymbols } from "@/lib/config"

export default function Home() {
  const chainCount = getChainNames().length
  const tokenCount = getAllTokenSymbols().length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Web3 套利监控系统</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃策略</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">当前正在监控的套利策略</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">支持的链</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{chainCount}</div>
            <p className="text-xs text-muted-foreground">以太坊、Polygon、Arbitrum等</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">监控代币</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tokenCount}</div>
            <p className="text-xs text-muted-foreground">USDC、ETH/WETH、USDT等</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>快速开始</CardTitle>
            <CardDescription>创建您的第一个套利监控策略</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  1
                </div>
                <div className="font-medium">配置链和代币信息</div>
              </div>
              <div className="text-sm text-muted-foreground ml-8">在设置页面配置您需要监控的区块链和代币地址</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  2
                </div>
                <div className="font-medium">创建套利策略</div>
              </div>
              <div className="text-sm text-muted-foreground ml-8">
                设置源链和目标链的代币兑换策略，包括初始金额和费用
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  3
                </div>
                <div className="font-medium">启动监控</div>
              </div>
              <div className="text-sm text-muted-foreground ml-8">
                在监控中心启动策略监控，实时追踪价格变化和套利机会
              </div>
            </div>

            <Button asChild className="w-full mt-4">
              <Link href="/strategies/configure">
                创建第一个策略
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>系统状态</CardTitle>
            <CardDescription>监控系统当前状态和配置信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">API 状态</span>
                <span className="text-sm text-green-500">正常</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">监控间隔</span>
                <span className="text-sm">3秒</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">已配置链</span>
                <span className="text-sm">{chainCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">已配置代币</span>
                <span className="text-sm">{tokenCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">系统版本</span>
                <span className="text-sm">1.0.0</span>
              </div>
            </div>

            <Button variant="outline" asChild className="w-full mt-4">
              <Link href="/settings">
                查看详细配置
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
