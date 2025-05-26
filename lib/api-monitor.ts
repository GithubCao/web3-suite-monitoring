import type { ApiMonitorRecord, ApiStats } from "./types"

// API监控存储键
const API_MONITOR_KEY = "web3-arbitrage-api-monitor"
const API_STATS_KEY = "web3-arbitrage-api-stats"

// 保存API监控记录
export const saveApiMonitorRecord = (record: ApiMonitorRecord): void => {
  if (typeof window !== "undefined") {
    const records = getApiMonitorRecords()
    records.push(record)

    // 只保留最近1000条记录
    const recentRecords = records.slice(-1000)
    localStorage.setItem(API_MONITOR_KEY, JSON.stringify(recentRecords))

    // 更新统计信息
    updateApiStats(record)
  }
}

// 获取API监控记录
export const getApiMonitorRecords = (): ApiMonitorRecord[] => {
  if (typeof window !== "undefined") {
    const data = localStorage.getItem(API_MONITOR_KEY)
    if (data) {
      try {
        return JSON.parse(data)
      } catch (error) {
        console.error("Error parsing API monitor records:", error)
      }
    }
  }
  return []
}

// 获取特定API的监控记录
export const getApiMonitorRecordsById = (apiId: string, limit = 100): ApiMonitorRecord[] => {
  const records = getApiMonitorRecords()
  return records
    .filter((record) => record.apiId === apiId)
    .slice(-limit)
    .sort((a, b) => b.timestamp - a.timestamp)
}

// 更新API统计信息
const updateApiStats = (record: ApiMonitorRecord): void => {
  const stats = getApiStats()
  const existingStats = stats.find((s) => s.apiId === record.apiId)

  if (existingStats) {
    // 更新现有统计
    existingStats.totalRequests++
    if (record.status === "success") {
      existingStats.successRequests++
    } else {
      existingStats.errorRequests++
    }

    // 更新平均响应时间
    existingStats.averageResponseTime =
      (existingStats.averageResponseTime * (existingStats.totalRequests - 1) + record.responseTime) /
      existingStats.totalRequests

    // 更新成功率
    existingStats.successRate = (existingStats.successRequests / existingStats.totalRequests) * 100
    existingStats.lastRequest = record.timestamp

    // 计算24小时内的统计
    const last24h = Date.now() - 24 * 60 * 60 * 1000
    const recent24hRecords = getApiMonitorRecordsById(record.apiId, 1000).filter((r) => r.timestamp > last24h)

    existingStats.last24hRequests = recent24hRecords.length
    const recent24hSuccess = recent24hRecords.filter((r) => r.status === "success").length
    existingStats.last24hSuccessRate =
      recent24hRecords.length > 0 ? (recent24hSuccess / recent24hRecords.length) * 100 : 0
  } else {
    // 创建新统计
    const newStats: ApiStats = {
      apiId: record.apiId,
      totalRequests: 1,
      successRequests: record.status === "success" ? 1 : 0,
      errorRequests: record.status === "success" ? 0 : 1,
      averageResponseTime: record.responseTime,
      successRate: record.status === "success" ? 100 : 0,
      lastRequest: record.timestamp,
      last24hRequests: 1,
      last24hSuccessRate: record.status === "success" ? 100 : 0,
    }
    stats.push(newStats)
  }

  saveApiStats(stats)
}

// 保存API统计信息
const saveApiStats = (stats: ApiStats[]): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem(API_STATS_KEY, JSON.stringify(stats))
  }
}

// 获取API统计信息
export const getApiStats = (): ApiStats[] => {
  if (typeof window !== "undefined") {
    const data = localStorage.getItem(API_STATS_KEY)
    if (data) {
      try {
        return JSON.parse(data)
      } catch (error) {
        console.error("Error parsing API stats:", error)
      }
    }
  }
  return []
}

// 获取特定API的统计信息
export const getApiStatsById = (apiId: string): ApiStats | null => {
  const stats = getApiStats()
  return stats.find((s) => s.apiId === apiId) || null
}

// 清除API监控数据
export const clearApiMonitorData = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(API_MONITOR_KEY)
    localStorage.removeItem(API_STATS_KEY)
  }
}

// 获取API健康状态
export const getApiHealthStatus = (apiId: string): "healthy" | "warning" | "error" => {
  const stats = getApiStatsById(apiId)
  if (!stats) return "error"

  const recentSuccessRate = stats.last24hSuccessRate
  const avgResponseTime = stats.averageResponseTime

  if (recentSuccessRate >= 95 && avgResponseTime < 5000) {
    return "healthy"
  } else if (recentSuccessRate >= 80 && avgResponseTime < 10000) {
    return "warning"
  } else {
    return "error"
  }
}

// 记录API调用
export const recordApiCall = async <T>(
  apiId: string,
  endpoint: string,
  chainId: number,
  apiCall: () => Promise<T>
)
: Promise<T> =>
{
  const startTime = Date.now()
  let status: "success" | "error" | "timeout" = "success"
  let error: string | undefined

  try {
    \
    const result = await apiCall()
    return result;
  } catch (err) {
    status = "error"
    error = err instanceof Error ? err.message : "Unknown error"
    throw err
  } finally {
    const responseTime = Date.now() - startTime

    const record: ApiMonitorRecord = {
      id: crypto.randomUUID(),
      apiId,
      timestamp: Date.now(),
      responseTime,
      status,
      error,
      chainId,
      endpoint,
    }

    saveApiMonitorRecord(record)
  }
}
