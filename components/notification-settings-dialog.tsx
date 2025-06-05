"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, Volume2, VolumeX } from "lucide-react"
import { notificationManager, type NotificationSettings } from "@/lib/notification"
import { useToast } from "@/components/ui/use-toast"

interface NotificationSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NotificationSettingsDialog({ open, onOpenChange }: NotificationSettingsDialogProps) {
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    soundEnabled: true,
    minProfitThreshold: 1.0,
    volume: 0.5,
  })
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      const currentSettings = notificationManager.getSettings()
      setSettings(currentSettings)

      // 检查通知权限
      if (typeof window !== "undefined" && "Notification" in window) {
        setHasNotificationPermission(Notification.permission === "granted")
      }
    }
  }, [open])

  const handleSave = () => {
    notificationManager.saveSettings(settings)
    toast({
      title: "设置已保存",
      description: "通知设置已成功保存",
    })
    onOpenChange(false)
  }

  const handleRequestPermission = async () => {
    const granted = await notificationManager.requestPermission()
    setHasNotificationPermission(granted)

    if (granted) {
      toast({
        title: "权限已授予",
        description: "现在可以接收浏览器通知了",
      })
    } else {
      toast({
        title: "权限被拒绝",
        description: "无法显示浏览器通知，但声音提醒仍然可用",
        variant: "destructive",
      })
    }
  }

  const handleTestSound = async () => {
    await notificationManager.playArbitrageAlert()
    toast({
      title: "测试声音",
      description: "播放了3次提示音",
    })
  }

  const handleTestNotification = async () => {
    await notificationManager.showNotification("套利机会测试", "这是一个测试通知，利润率: 2.5%", 2.5)
    toast({
      title: "测试通知",
      description: "已发送测试通知和声音提醒",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            通知设置
          </DialogTitle>
          <DialogDescription>配置套利机会的通知和声音提醒设置</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 基本设置 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">基本设置</CardTitle>
              <CardDescription>控制通知的基本开关和阈值</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="notifications-enabled">启用通知</Label>
                <Switch
                  id="notifications-enabled"
                  checked={settings.enabled}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, enabled: checked }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profit-threshold">最小利润阈值 (%)</Label>
                <Input
                  id="profit-threshold"
                  type="number"
                  step="0.1"
                  min="0"
                  value={settings.minProfitThreshold}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      minProfitThreshold: Number.parseFloat(e.target.value) || 0,
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">只有当利润率超过此阈值时才会发送通知</p>
              </div>
            </CardContent>
          </Card>

          {/* 声音设置 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {settings.soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                声音提醒
              </CardTitle>
              <CardDescription>配置声音提醒的相关设置</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="sound-enabled">启用声音提醒</Label>
                <Switch
                  id="sound-enabled"
                  checked={settings.soundEnabled}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, soundEnabled: checked }))}
                />
              </div>

              {settings.soundEnabled && (
                <>
                  <div className="space-y-2">
                    <Label>音量: {Math.round(settings.volume * 100)}%</Label>
                    <Slider
                      value={[settings.volume]}
                      onValueChange={([value]) => setSettings((prev) => ({ ...prev, volume: value }))}
                      max={1}
                      min={0}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  <Button variant="outline" size="sm" onClick={handleTestSound} className="w-full">
                    <Volume2 className="mr-2 h-4 w-4" />
                    测试声音 (3次提示音)
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* 浏览器通知 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">浏览器通知</CardTitle>
              <CardDescription>系统级通知设置</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>通知权限</Label>
                  <p className="text-xs text-muted-foreground">{hasNotificationPermission ? "已授权" : "未授权"}</p>
                </div>
                {!hasNotificationPermission && (
                  <Button variant="outline" size="sm" onClick={handleRequestPermission}>
                    请求权限
                  </Button>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleTestNotification}
                className="w-full"
                disabled={!settings.enabled}
              >
                <Bell className="mr-2 h-4 w-4" />
                测试通知
              </Button>
            </CardContent>
          </Card>
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
