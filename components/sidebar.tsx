"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  HomeIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  ClockIcon,
  BanknotesIcon,
  RocketLaunchIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export default function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className={cn("pb-12 w-64 bg-gray-50 border-r min-h-screen", className)}>
      <div className="space-y-4 py-4">
        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-xl font-semibold tracking-tight">
            套利监控系统
          </h2>
          <div className="space-y-1">
            <Button
              asChild
              variant={pathname === "/" ? "default" : "ghost"}
              className="w-full justify-start"
            >
              <Link href="/">
                <HomeIcon className="mr-2 h-4 w-4" />
                仪表盘
              </Link>
            </Button>
            <Button
              asChild
              variant={pathname === "/strategies" ? "default" : "ghost"}
              className="w-full justify-start"
            >
              <Link href="/strategies">
                <RocketLaunchIcon className="mr-2 h-4 w-4" />
                策略管理
              </Link>
            </Button>
            <Button
              asChild
              variant={pathname === "/monitor" ? "default" : "ghost"}
              className="w-full justify-start"
            >
              <Link href="/monitor">
                <ChartBarIcon className="mr-2 h-4 w-4" />
                实时监控
              </Link>
            </Button>
            <Button
              asChild
              variant={pathname === "/history" ? "default" : "ghost"}
              className="w-full justify-start"
            >
              <Link href="/history">
                <ClockIcon className="mr-2 h-4 w-4" />
                历史记录
              </Link>
            </Button>
          </div>
        </div>
        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
            资产管理
          </h2>
          <div className="space-y-1">
            <Button
              asChild
              variant={pathname === "/tokens" ? "default" : "ghost"}
              className="w-full justify-start"
            >
              <Link href="/tokens">
                <CurrencyDollarIcon className="mr-2 h-4 w-4" />
                代币管理
              </Link>
            </Button>
            <Button
              asChild
              variant={pathname === "/wallets" ? "default" : "ghost"}
              className="w-full justify-start"
            >
              <Link href="/wallets">
                <BanknotesIcon className="mr-2 h-4 w-4" />
                钱包管理
              </Link>
            </Button>
          </div>
        </div>
        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
            系统设置
          </h2>
          <div className="space-y-1">
            <Button
              asChild
              variant={pathname === "/settings" ? "default" : "ghost"}
              className="w-full justify-start"
            >
              <Link href="/settings">
                <Cog6ToothIcon className="mr-2 h-4 w-4" />
                系统配置
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
