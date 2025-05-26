"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import type { Strategy } from "@/lib/types"
import { getStrategies, deleteStrategy, updateStrategyStatus, duplicateStrategy } from "@/lib/storage"
import { useToast } from "@/components/ui/use-toast"
import { Edit, MoreHorizontal, Play, Square, Trash2, Plus, Copy } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { StrategyImportExport } from "@/components/strategy-import-export"

export default function StrategiesPage() {
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    // 加载策略
    const loadStrategies = () => {
      const loadedStrategies = getStrategies()
      setStrategies(loadedStrategies)
    }

    loadStrategies()

    // 设置定时刷新
    const interval = setInterval(loadStrategies, 5000)

    return () => clearInterval(interval)
  }, [])

  const handleDelete = (id: string) => {
    deleteStrategy(id)
    setStrategies(strategies.filter((s) => s.id !== id))
    toast({
      title: "策略已删除",
      description: "套利策略已成功删除",
    })
  }

  const handleToggleStatus = (id: string, currentStatus: boolean) => {
    updateStrategyStatus(id, !currentStatus)
    setStrategies(strategies.map((s) => (s.id === id ? { ...s, isActive: !currentStatus } : s)))

    toast({
      title: currentStatus ? "策略已停止" : "策略已启动",
      description: currentStatus ? "套利策略监控已停止" : "套利策略监控已启动，将在监控页面显示",
    })
  }

  // 复制策略
  const handleDuplicate = (id: string) => {
    const newStrategy = duplicateStrategy(id)

    if (newStrategy) {
      setStrategies([...strategies, newStrategy])
      toast({
        title: "策略已复制",
        description: `已创建策略 "${newStrategy.name}" 的副本`,
      })
    } else {
      toast({
        title: "复制失败",
        description: "无法复制策略",
        variant: "destructive",
      })
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  // 刷新策略列表
  const refreshStrategies = () => {
    const loadedStrategies = getStrategies()
    setStrategies(loadedStrategies)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">策略管理</h1>
        <div className="flex gap-2">
          <StrategyImportExport onComplete={refreshStrategies} />
          <Button asChild>
            <Link href="/strategies/configure">
              <Plus className="mr-2 h-4 w-4" />
              新建策略
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>套利策略列表</CardTitle>
          <CardDescription>管理您创建的所有套利监控策略</CardDescription>
        </CardHeader>
        <CardContent>
          {strategies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-muted-foreground mb-4">您还没有创建任何套利策略</div>
              <Button asChild>
                <Link href="/strategies/configure">
                  <Plus className="mr-2 h-4 w-4" />
                  创建第一个策略
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>策略名称</TableHead>
                  <TableHead>源链/代币</TableHead>
                  <TableHead>目标链/代币</TableHead>
                  <TableHead>初始金额</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {strategies.map((strategy) => (
                  <TableRow key={strategy.id}>
                    <TableCell className="font-medium">{strategy.name}</TableCell>
                    <TableCell>
                      {strategy.sourceChain}/{strategy.sourceToken}
                    </TableCell>
                    <TableCell>
                      {strategy.targetChain}/{strategy.targetToken}
                    </TableCell>
                    <TableCell>{strategy.initialAmount}</TableCell>
                    <TableCell>
                      <Badge variant={strategy.isActive ? "default" : "outline"}>
                        {strategy.isActive ? "监控中" : "已停止"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(strategy.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">打开菜单</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/strategies/edit/${strategy.id}`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            编辑
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(strategy.id)}>
                            <Copy className="mr-2 h-4 w-4" />
                            复制
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(strategy.id, strategy.isActive)}>
                            {strategy.isActive ? (
                              <>
                                <Square className="mr-2 h-4 w-4" />
                                停止监控
                              </>
                            ) : (
                              <>
                                <Play className="mr-2 h-4 w-4" />
                                启动监控
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDelete(strategy.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
