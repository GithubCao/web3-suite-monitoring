"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { getStrategyById, updateStrategy } from "@/lib/storage"
import type { Strategy } from "@/lib/types"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

const EditStrategyPage = () => {
  const router = useRouter()
  const params = useParams()
  const strategyId = params.id as string

  const [strategy, setStrategy] = useState<Strategy | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStrategy = () => {
      setLoading(true)
      try {
        const data = getStrategyById(strategyId)
        if (data) {
          setStrategy(data)
          setName(data.name)
          setDescription(data.description || "")
          setAmount(data.amount)
        } else {
          toast.error("策略不存在")
          router.push("/strategies")
        }
      } catch (error: any) {
        console.error("获取策略时出错:", error)
        toast.error(`获取策略时出错: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }

    if (strategyId) {
      fetchStrategy()
    }
  }, [strategyId, router])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (!strategy) {
        throw new Error("策略不存在")
      }

      const updatedStrategy: Strategy = {
        ...strategy,
        name,
        description,
        amount,
      }

      updateStrategy(updatedStrategy)
      toast.success("策略更新成功!")
      router.push("/strategies")
    } catch (error: any) {
      console.error("更新策略时出错:", error)
      toast.error(`更新策略时出错: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="container mx-auto py-10">加载中...</div>
  }

  if (!strategy) {
    return <div className="container mx-auto py-10">未找到策略。</div>
  }

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" size="sm" asChild className="mr-2">
          <Link href="/strategies">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回策略列表
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>编辑策略</CardTitle>
          <CardDescription>修改策略的基本信息。</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">策略名称</Label>
              <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="amount">初始金额</Label>
              <Input id="amount" type="text" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => router.push("/strategies")}>
                取消
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "更新中..." : "更新策略"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground">
        <p>注意：如需修改更多高级设置，请删除此策略并创建新策略。</p>
      </div>
    </div>
  )
}

export default EditStrategyPage
