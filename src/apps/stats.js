import { logger, karin, segment } from 'node-karin'

import { loadConfig } from '../config.js'
import { getFailures, getStats } from '../stats.js'
import { createImageBedService } from '../service.js'

const service = createImageBedService(loadConfig())

function linesForStats(days) {
  const rows = getStats(days)
  if (!rows.length) return `## 图床状态\n\n近 ${days} 天暂无上传记录。`
  const lines = rows.map((row) => `| ${row.provider} | ${row.success} | ${row.failed} | ${(row.rate * 100).toFixed(1)}% | ${row.averageMs}ms |`)
  return `# 图床状态\n\n统计区间：${days} 天\n\n| Provider | 成功 | 失败 | 成功率 | 平均耗时 |\n|---|---:|---:|---:|---:|\n${lines.join('\n')}`
}

export const imageBedStats = karin.command(/^#(?:图床|imagebed)状态(?:([0-9]+)天)?$/i, async (event) => {
  const days = Number(event.regex?.[1] || event.msg.match(/([0-9]+)天/)?.[1] || 1)
  await event.reply(segment.markdown(linesForStats(days)))
  return true
}, { name: '图床状态', perm: 'master', authFailMsg: '' })

export const imageBedFailures = karin.command(/^#(?:图床|imagebed)失败(?:记录|原因)(?:([0-9]+)天)?$/i, async (event) => {
  const days = Number(event.regex?.[1] || event.msg.match(/([0-9]+)天/)?.[1] || 1)
  const failures = getFailures(days)
  const content = failures.length
    ? `# 图床失败原因\n\n统计区间：${days} 天\n\n${failures.map(([reason, count]) => `- ${count} 次：${reason}`).join('\n')}`
    : `## 图床失败原因\n\n近 ${days} 天没有失败记录。`
  await event.reply(segment.markdown(content))
  return true
}, { name: '图床失败原因', perm: 'master', authFailMsg: '' })

export const imageBedHealth = karin.command(/^#(?:图床|imagebed)检查$/i, async (event) => {
  const rows = []
  for (const provider of service.providers.values()) {
    if (!provider.enabled) continue
    rows.push(`| ${provider.name} | 已启用 | 上传测试请使用 #图床 |`)
  }
  await event.reply(segment.markdown(`# 图床配置\n\n| Provider | 状态 | 说明 |\n|---|---|---|\n${rows.join('\n') || '| — | 无 | 没有启用的图床 |'}`))
  return true
}, { name: '图床配置检查', perm: 'master', authFailMsg: '' })

logger.info('[imagebed] 状态命令已注册: #图床状态 / #图床失败原因 / #图床检查')
