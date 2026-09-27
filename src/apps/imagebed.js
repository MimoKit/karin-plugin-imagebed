import fs from 'node:fs/promises'

import karin, { logger, segment } from 'node-karin'

import { loadConfig } from '../config.js'
import { resultMarkdown } from '../markdown.js'
import { createImageBedService } from '../service.js'

const service = createImageBedService(loadConfig())

/** 计算天数：从命令文本里取「N天」，缺省 1 天，范围 1~30。 */
function parseDays(msg, fallback = 1) {
  const matched = String(msg || '').match(/(\d+)\s*天/)
  const days = matched ? Number.parseInt(matched[1], 10) : fallback
  if (!Number.isFinite(days)) return fallback
  return Math.min(Math.max(days, 1), 30)
}

function isQQBot(event) {
  const name = event.bot?.adapter?.name || event.adapter?.name || ''
  return String(name).includes('QQ')
}

function extractImageSource(event) {
  const elements = Array.isArray(event.elements) ? event.elements : []
  for (const item of elements) {
    if (item?.type !== 'image') continue
    const data = item.data || {}
    return data.url || data.file || item.url || item.file || null
  }
  const matched = String(event.msg || '').match(/https?:\/\/\S+/i)
  return matched?.[0] || null
}

async function readSource(source) {
  if (!source) throw new Error('没有找到图片。请附带图片，或在命令后提供图片 URL。')
  if (Buffer.isBuffer(source)) return source
  const text = String(source).trim()
  if (text.startsWith('base64://')) return Buffer.from(text.slice(9), 'base64')
  if (text.startsWith('data:')) return Buffer.from(text.split(',', 2)[1] || '', 'base64')
  if (/^https?:\/\//i.test(text)) {
    const response = await fetch(text, { signal: AbortSignal.timeout(30000) })
    if (!response.ok) throw new Error(`下载图片失败 HTTP ${response.status}`)
    return Buffer.from(await response.arrayBuffer())
  }
  return fs.readFile(text)
}

async function replyMarkdownOrImage(event, markdown, text, imageUrl) {
  const config = loadConfig()
  if (config.markdown?.enabled !== false && isQQBot(event)) {
    await event.reply(segment.markdown(markdown))
    return
  }
  await event.reply([segment.text(text), segment.image(imageUrl)])
}

export const imageBedUpload = karin.command(
  /^#(?:图床|测试图床|图床测试)$/i,
  async (event) => {
    try {
      const source = extractImageSource(event)
      const buffer = await readSource(source)
      const result = await service.upload(buffer, { name: 'image.png' })
      const width = loadConfig().markdown?.maxImageWidth ?? 720
      await replyMarkdownOrImage(
        event,
        resultMarkdown(result, '图床上传结果', width),
        `图床上传成功：${result.provider} · ${result.cost}ms\n`,
        result.url,
      )
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      logger.error(`[imagebed] 上传失败: ${message}`)
      await event.reply(`图床上传失败：${message}`)
      return false
    }
  },
  { name: '图床上传', perm: 'master', authFailMsg: '' },
)

export const imageBedStats = karin.command(
  /^#(?:图床|imagebed)状态(?:\s*([0-9]+)\s*天)?$/i,
  async (event) => {
    const { getStats } = await import('../stats.js')
    const days = parseDays(event.msg)
    const rows = getStats(days)
    const content = rows.length
      ? `# 图床状态\n\n统计区间：${days} 天\n\n| Provider | 成功 | 失败 | 成功率 | 平均耗时 |\n|---|---:|---:|---:|---:|\n${rows
          .map((row) => `| ${row.provider} | ${row.success} | ${row.failed} | ${(row.rate * 100).toFixed(1)}% | ${row.averageMs}ms |`)
          .join('\n')}`
      : `## 图床状态\n\n近 ${days} 天暂无上传记录。`
    await replyMarkdownOrImage(event, content, content, '')
    return true
  },
  { name: '图床状态', perm: 'master', authFailMsg: '' },
)

export const imageBedFailures = karin.command(
  /^#(?:图床|imagebed)失败(?:记录|原因)(?:\s*([0-9]+)\s*天)?$/i,
  async (event) => {
    const { getFailures } = await import('../stats.js')
    const days = parseDays(event.msg)
    const failures = getFailures(days)
    const content = failures.length
      ? `# 图床失败原因\n\n统计区间：${days} 天\n\n${failures.map(([reason, count]) => `- **${count} 次**：${reason}`).join('\n')}`
      : `## 图床失败原因\n\n近 ${days} 天没有失败记录。`
    await replyMarkdownOrImage(event, content, content, '')
    return true
  },
  { name: '图床失败原因', perm: 'master', authFailMsg: '' },
)

export const imageBedCheck = karin.command(
  /^#(?:图床|imagebed)检查$/i,
  async (event) => {
    const rows = [...service.providers.values()]
      .map((provider) => `| ${provider.name} | ${provider.enabled ? '已启用' : '未启用'} |`)
      .join('\n')
    const content = `# 图床配置\n\n| Provider | 状态 |\n|---|---|\n${rows}`
    await replyMarkdownOrImage(event, content, content, '')
    return true
  },
  { name: '图床配置检查', perm: 'master', authFailMsg: '' },
)

logger.info('[imagebed] 指令已注册: #图床 / #测试图床 / #图床状态 / #图床失败原因 / #图床检查')
