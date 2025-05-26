"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Settings, BarChart3, PlusCircle, Activity } from "lucide-react"
import { cn } from "@/lib/utils"

export default function Sidebar() {
  const pathname = usePathname()

  const routes = [
    {
      href: "/",
      icon: Home,
      label: "首页",
    },
    {
      href: "/strategies",
      icon: BarChart3,
      label: "策略管理",
    },
    {
      href: "/strategies/configure",
      icon: PlusCircle,
      label: "创建策略",
    },
    {
      href: "/monitor",
      icon: Activity,
      label: "监控中心",
    },
    {
      href: "/settings",
      icon: Settings,
      label: "配置设置",
    },
  ]

  return (
    <div className="flex flex-col h-screen w-64 bg-white border-r">
      <div className="p-6">
        <h1 className="text-xl font-bold text-blue-600">Web3 套利监控</h1>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:text-blue-600",
              pathname === route.href ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-500",
            )}
          >
            <route.icon className="h-4 w-4" />
            {route.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t">
        <div className="text-xs text-gray-500">© 2025 Web3 套利监控</div>
      </div>
    </div>
  )
}
