"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Key, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface WalletSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface WalletSettings {
  enabled: boolean
  address: string
  privateKey: string
  gasLimit: string
  maxGasPrice: string
  slippage: string
  network: string
}

export function WalletSettingsDialog({ open, onOpenChange }: WalletSettingsDialogProps) {
  const [settings, setSettings] = useState<WalletSettings>({
    enabled: false,
    address: "",
    privateKey: "",
    gasLimit: "300000",
    maxGasPrice: "50",
    slippage: "0.5",
    network: "ethereum",
  })

  const [loading, setLoading] = useState(false)
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const { toast } = useToast()

  // 加载保存的设置
  useEffect(() => {
    if (open) {
      const savedSettings = localStorage.getItem("walletSettings")
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings)
          setSettings(parsed)
        } catch (error) {
          console.error("Failed to parse wallet settings:", error)
        }
      }
    }
  }, [open])

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSettings({
      ...settings,
      [name]: value,
    })
  }

  // 处理开关变化
  const handleSwitchChange = (checked: boolean) => {
    setSettings({
      ...settings,
      enabled: checked,
    })
  }

  // 处理选择变化
  const handleSelectChange = (name: string, value: string) => {
    setSettings({
      ...settings,
      [name]: value,
    })
  }

  // 保存设置
  const saveSettings = () => {
    setLoading(true)

    try {
      // 验证设置
      if (settings.enabled) {
        if (!settings.address) throw new Error("请输入钱包地址")
        if (!settings.privateKey) throw new Error("请输入私钥")
      }

      // 保存设置到本地存储
      localStorage.setItem("walletSettings", JSON.stringify(settings))

      toast({
        title: "设置已保存",
        description: "自动交易钱包设置已成功保存",
      })

      onOpenChange(false)
    } catch (error) {
      toast({
        title: "保存失败",
        description: error instanceof Error ? error.message : "无法保存钱包设置",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>自动交易钱包设置</DialogTitle>
          <DialogDescription>配置用于自动执行套利交易的钱包</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="enabled" className="flex flex-col space-y-1">
              <span>启用自动交易钱包</span>
              <span className="font-normal text-xs text-muted-foreground">启用后，系统将使用此钱包执行自动交易</span>
            </Label>
            <Switch id="enabled" checked={settings.enabled} onCheckedChange={handleSwitchChange} />
          </div>

          {settings.enabled && (
            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>安全警告</AlertTitle>
              <AlertDescription>
                私钥将存储在您的浏览器本地存储中。请确保您的设备安全，并且只在您信任的环境中使用此功能。
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="wallet" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="wallet">钱包信息</TabsTrigger>
              <TabsTrigger value="transaction">交易设置</TabsTrigger>
            </TabsList>

            <TabsContent value="wallet" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="address">钱包地址</Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="输入钱包地址 (0x...)"
                  value={settings.address}
                  onChange={handleInputChange}
                  disabled={!settings.enabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="privateKey" className="flex items-center justify-between">
                  <span>私钥</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                    disabled={!settings.enabled}
                  >
                    <Key className="h-4 w-4 mr-1" />
                    {showPrivateKey ? "隐藏" : "显示"}
                  </Button>
                </Label>
                <Input
                  id="privateKey"
                  name="privateKey"
                  type={showPrivateKey ? "text" : "password"}
                  placeholder="输入私钥"
                  value={settings.privateKey}
                  onChange={handleInputChange}
                  disabled={!settings.enabled}
                />
                <p className="text-xs text-muted-foreground">私钥用于签名交易，请确保其安全</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="network">网络</Label>
                <Select
                  value={settings.network}
                  onValueChange={(value) => handleSelectChange("network", value)}
                  disabled={!settings.enabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择网络" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ethereum">以太坊主网</SelectItem>
                    <SelectItem value="bsc">币安智能链</SelectItem>
                    <SelectItem value="polygon">Polygon</SelectItem>
                    <SelectItem value="arbitrum">Arbitrum</SelectItem>
                    <SelectItem value="optimism">Optimism</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="transaction" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="gasLimit">Gas 限制</Label>
                <Input
                  id="gasLimit"
                  name="gasLimit"
                  type="number"
                  placeholder="输入 Gas 限制"
                  value={settings.gasLimit}
                  onChange={handleInputChange}
                  disabled={!settings.enabled}
                />
                <p className="text-xs text-muted-foreground">交易的最大 Gas 限制</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxGasPrice">最大 Gas 价格 (Gwei)</Label>
                <Input
                  id="maxGasPrice"
                  name="maxGasPrice"
                  type="number"
                  placeholder="输入最大 Gas 价格"
                  value={settings.maxGasPrice}
                  onChange={handleInputChange}
                  disabled={!settings.enabled}
                />
                <p className="text-xs text-muted-foreground">交易的最大 Gas 价格，单位为 Gwei</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="slippage">滑点容忍度 (%)</Label>
                <Input
                  id="slippage"
                  name="slippage"
                  type="number"
                  step="0.1"
                  placeholder="输入滑点容忍度"
                  value={settings.slippage}
                  onChange={handleInputChange}
                  disabled={!settings.enabled}
                />
                <p className="text-xs text-muted-foreground">交易执行时允许的最大价格变动百分比</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={saveSettings} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            保存设置
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
