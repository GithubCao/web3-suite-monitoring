import dynamic from "next/dynamic"

// 禁用 SSR 的组件
const MonitorPageClient = dynamic(() => import("./monitor-client"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p>加载监控中心...</p>
      </div>
    </div>
  ),
})

export default function MonitorPage() {
  return <MonitorPageClient />
}
