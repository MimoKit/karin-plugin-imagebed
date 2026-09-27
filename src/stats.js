const records = []
const MAX_RECORDS = 2000

export function recordUpload({ provider, success, cost = 0, size = 0, error = '' }) {
  records.push({ provider, success, cost, size, error: success ? '' : String(error).slice(0, 160), at: Date.now() })
  while (records.length > MAX_RECORDS) records.shift()
}

export function getStats(days = 1) {
  const since = Date.now() - Math.max(1, Number(days) || 1) * 86400000
  const recent = records.filter((record) => record.at >= since)
  const byProvider = new Map()
  for (const record of recent) {
    const current = byProvider.get(record.provider) || { provider: record.provider, success: 0, failed: 0, totalSize: 0, costs: [] }
    if (record.success) {
      current.success += 1
      current.totalSize += record.size
      current.costs.push(record.cost)
    } else current.failed += 1
    byProvider.set(record.provider, current)
  }
  return [...byProvider.values()].map((item) => ({
    ...item,
    averageMs: item.costs.length ? Math.round(item.costs.reduce((a, b) => a + b, 0) / item.costs.length) : 0,
    rate: item.success + item.failed ? item.success / (item.success + item.failed) : 0,
  }))
}

export function getFailures(days = 1) {
  const since = Date.now() - Math.max(1, Number(days) || 1) * 86400000
  const count = new Map()
  for (const record of records.filter((item) => !item.success && item.at >= since)) {
    count.set(record.error || '未知错误', (count.get(record.error || '未知错误') || 0) + 1)
  }
  return [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)
}

export function clearStats() { records.length = 0 }
