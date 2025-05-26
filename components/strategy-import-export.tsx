"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { exportStrategies, importStrategies } from "@/lib/storage"
import { Loader2, Upload, Download, Copy, Check } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface StrategyImportExportProps {
  onComplete?: () => void
}

export function StrategyImportExport({ onComplete }: StrategyImportExportProps) {
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [importData, setImportData] = useState("")
  const [exportData, setExportData] = useState("")
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // 导出策略
  const handleExport = () => {
    setLoading(true)
    setError(null)

    try {
      const data = exportStrategies()
      setExportData(data)
      setExportDialogOpen(true)
    } catch (err) {
      setError("导出策略失败")
      toast({
        title: "导出失败",
        description: "无法导出策略数据",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // 导入策略
  const handleImport = () => {
    setImportDialogOpen(true)
  }

  // 确认导入
  const confirmImport = () => {
    setLoading(true)
    setError(null)

    try {
      const result = importStrategies(importData)

      if (result.success) {
        toast({
          title: "导入成功",
          description: `成功导入 ${result.count} 个策略`,
        })
        setImportDialogOpen(false)
        setImportData("")
        if (onComplete) onComplete()
      } else {
        setError(result.error || "导入失败")
        toast({
          title: "导入失败",
          description: result.error || "无法导入策略数据",
          variant: "destructive",
        })
      }
    } catch (err) {
      setError("导入策略失败")
      toast({
        title: "导入失败",
        description: "无法导入策略数据",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // 复制导出数据
  const copyExportData = () => {
    navigator.clipboard.writeText(exportData)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)

    toast({
      title: "已复制",
      description: "策略数据已复制到剪贴板",
    })
  }

  // 下载导出数据
  const downloadExportData = () => {
    const blob = new Blob([exportData], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `web3-arbitrage-strategies-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "已下载",
      description: "策略数据已下载到本地",
    })
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={handleImport} disabled={loading}>
        <Upload className="mr-2 h-4 w-4" />
        导入策略
      </Button>

      <Button variant="outline" onClick={handleExport} disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
        导出策略
      </Button>

      {/* 导入对话框 */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>导入策略</DialogTitle>
            <DialogDescription>粘贴之前导出的策略数据以导入</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Textarea
              placeholder="粘贴策略数据 (JSON 格式)"
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              className="min-h-[200px]"
            />

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)} disabled={loading}>
              取消
            </Button>
            <Button onClick={confirmImport} disabled={!importData || loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              确认导入
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 导出对话框 */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>导出策略</DialogTitle>
            <DialogDescription>复制或下载策略数据以备份或分享</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Textarea value={exportData} readOnly className="min-h-[200px]" />
          </div>

          <DialogFooter>
            <div className="flex gap-2">
              <Button variant="outline" onClick={copyExportData}>
                {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                复制
              </Button>
              <Button variant="outline" onClick={downloadExportData}>
                <Download className="mr-2 h-4 w-4" />
                下载
              </Button>
              <Button onClick={() => setExportDialogOpen(false)}>关闭</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
