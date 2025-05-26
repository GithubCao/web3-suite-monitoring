import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowUpRight, ArrowDownRight, TrendingUp, Clock } from "lucide-react"
import type { ArbitrageOpportunity } from "@/lib/types"

interface DashboardStatsProps {
  opportunities: ArbitrageOpportunity[]
}

export function DashboardStats({ opportunities }: DashboardStatsProps) {
  // 计算统计数据
  const profitableOpportunities = opportunities.filter((o) => o.profitPercentage > 0)
  const highProfitOpportunities = opportunities.filter((o) => o.profitPercentage > 1.0)

  // 找出最高利润的机会
  const bestOpportunity =
    opportunities.length > 0
      ? opportunities.reduce((prev, current) => (prev.profitPercentage > current.profitPercentage ? prev : current))
      : null

  // 计算平均利润
  const averageProfit =
    opportunities.length > 0 ? opportunities.reduce((sum, o) => sum + o.profitPercentage, 0) / opportunities.length : 0

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="overview">概览</TabsTrigger>
        <TabsTrigger value="profit">利润分析</TabsTrigger>
        <TabsTrigger value="chains">链分析</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4 mt-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">监控策略</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{opportunities.length}</div>
              <p className="text-xs text-muted-foreground">活跃监控中的策略数量</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">套利机会</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{highProfitOpportunities.length}</div>
              <p className="text-xs text-muted-foreground">利润 &gt; 1% 的套利机会</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">最高利润</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {bestOpportunity ? bestOpportunity.profitPercentage.toFixed(2) + "%" : "0.00%"}
              </div>
              <p className="text-xs text-muted-foreground">
                {bestOpportunity ? `${bestOpportunity.sourceChain} → ${bestOpportunity.targetChain}` : "暂无数据"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">平均利润</CardTitle>
              {averageProfit > 0 ? (
                <ArrowUpRight className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageProfit.toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground">所有策略的平均利润率</p>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="profit" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>利润分布</CardTitle>
            <CardDescription>各策略的利润分布情况</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              利润分析图表将在这里显示
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="chains" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>链分析</CardTitle>
            <CardDescription>不同链之间的套利机会分析</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              链分析图表将在这里显示
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
