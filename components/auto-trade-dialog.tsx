"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { updateStrategyAutoTrade } from "@/lib/storage"
import { useToast } from "@/components/ui/use-toast"
import type { Strategy } from "@/lib/types"

interface AutoTradeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  strategy: Strategy
  onUpdate: () => void
}

export function AutoTradeDialog({ open, onOpenChange, strategy, onUpdate }: AutoTradeDialogProps) {
  const [autoTrade, setAutoTrade] = useState(strategy.autoTrade || false)
  const [minProfitPercentage, setMinProfitPercentage] = useState(strategy.minProfitPercentage || "1.0")
  const { toast } = useToast()

  // 重置表单
  useEffect(() => {
    if (open) {
      setAutoTrade(strategy.autoTrade || false)
      setMinProfitPercentage(strategy.minProfitPercentage || "1.0")
    }
  }, [open, strategy])

  // 保存设置
  const handleSave = () => {
    updateStrategyAutoTrade(strategy.id, autoTrade, minProfitPercentage)

    toast({
      title: "自动交易设置已更新",
      description: autoTrade ? "已启用自动交易功能" : "已禁用自动交易功能",
    })

    onUpdate()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>自动交易设置</DialogTitle>
          <DialogDescription>配置 {strategy.name} 策略的自动交易参数</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-trade" className="flex flex-col space-y-1">
              <span>启用自动交易</span>
              <span className="font-normal text-xs text-muted-foreground">当利润超过阈值时自动执行交易</span>
            </Label>
            <Switch id="auto-trade" checked={autoTrade} onCheckedChange={setAutoTrade} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="min-profit">最小利润阈值 (%)</Label>
            <Input
              id="min-profit"
              type="number"
              step="0.1"
              min="0"
              value={minProfitPercentage}
              onChange={(e) => setMinProfitPercentage(e.target.value)}
              disabled={!autoTrade}
            />
            <p className="text-xs text-muted-foreground">当套利利润百分比超过此阈值时，系统将自动执行交易</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave}>保存设置</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
