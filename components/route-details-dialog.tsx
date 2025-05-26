import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowRight } from "lucide-react"
import type { RouteStep } from "@/lib/types"

interface RouteDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sourceChain: string
  targetChain: string
  sourceRoute?: RouteStep[]
  targetRoute?: RouteStep[]
}

export function RouteDetailsDialog({
  open,
  onOpenChange,
  sourceChain,
  targetChain,
  sourceRoute,
  targetRoute,
}: RouteDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>交易路径详情</DialogTitle>
          <DialogDescription>
            {sourceChain} 和 {targetChain} 之间的交易路径
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">{sourceChain} 交易路径</h3>
            {!sourceRoute || sourceRoute.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">暂无路径数据</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>DEX</TableHead>
                    <TableHead>交易对</TableHead>
                    <TableHead>费率</TableHead>
                    <TableHead>输入金额</TableHead>
                    <TableHead>输出金额</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sourceRoute.map((step, index) => (
                    <TableRow key={index}>
                      <TableCell>{step.dexName}</TableCell>
                      <TableCell>
                        {step.tokenIn} <ArrowRight className="inline h-3 w-3 mx-1" /> {step.tokenOut}
                      </TableCell>
                      <TableCell>{(step.poolFee * 100).toFixed(2)}%</TableCell>
                      <TableCell>{Number.parseFloat(step.amountIn).toFixed(6)}</TableCell>
                      <TableCell>{Number.parseFloat(step.amountOut).toFixed(6)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">{targetChain} 交易路径</h3>
            {!targetRoute || targetRoute.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">暂无路径数据</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>DEX</TableHead>
                    <TableHead>交易对</TableHead>
                    <TableHead>费率</TableHead>
                    <TableHead>输入金额</TableHead>
                    <TableHead>输出金额</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {targetRoute.map((step, index) => (
                    <TableRow key={index}>
                      <TableCell>{step.dexName}</TableCell>
                      <TableCell>
                        {step.tokenIn} <ArrowRight className="inline h-3 w-3 mx-1" /> {step.tokenOut}
                      </TableCell>
                      <TableCell>{(step.poolFee * 100).toFixed(2)}%</TableCell>
                      <TableCell>{Number.parseFloat(step.amountIn).toFixed(6)}</TableCell>
                      <TableCell>{Number.parseFloat(step.amountOut).toFixed(6)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
