"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"

// 使用动态导入但不禁用 SSR
const MonitorPageClient = dynamic(() => import("./monitor-client"), {
  loading: () => <MonitorLoading />,
})

function MonitorLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p>加载监控中心...</p>
      </div>
    </div>
  )
}

export default function MonitorPage() {
  return (
    <Suspense fallback={<MonitorLoading />}>
      <MonitorPageClient />
    </Suspense>
  )
}
