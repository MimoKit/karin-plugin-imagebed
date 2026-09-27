import fs from 'node:fs/promises'

import karin, { logger, segment } from 'node-karin'

import { loadConfig } from '../config.js'
import { resultMarkdown } from '../markdown.js'
import { createImageBedService } from '../service.js'

const service = createImageBedService(loadConfig())

function isQQBot(event) {
  return event.bot?.adapter?.name === 'QQ Official Bot' || event.adapter?.name === 'QQ Official Bot'
}

function extractImageSource(event) {
  const elements = Array.isArray(event.elements) ? event.elements : []
  const image = elements.find((item) => item?.type === 'image')
  if (image) return image.data?.url || image.data?.file || image.url || image.file || null
  const text = String(event.msg || '').trim()
  const match = text.match(/https?:\/\/\S+/i)
  return match?.[0] || null
}

async function readSource(source) {
  if (!source) throw new Error('没有找到图片。请在消息中附带图片，或在命令后提供图片 URL。')
  if (Buffer.isBuffer(source)) return source
  const text = String(source)
  if (text.startsWith('base64://')) return Buffer.from(text.slice(9), 'base64')
  if (text.startsWith('data:')) return Buffer.from(text.split(',', 2)[1] || '', 'base64')
  if (/^https?:\/\//i.test(text)) return Buffer.from(await (await fetch(text, { signal: AbortSignal.timeout(30000) })).arrayBuffer())
  return fs.readFile(text)
}

export const testImageBed = karin.command(
  /^#(?:测试图床|图床)(?:\s+.*)?$/i,
  async (event) => {
    try {
      const source = extractImageSource(event)
      const buffer = await readSource(source)
      const result = await service.upload(buffer, { name: 'image.png' })
      const config = loadConfig()
      if (config.markdown?.enabled && isQQBot(event)) {
        await event.reply(segment.markdown(resultMarkdown(result, '图床上传结果', config.markdown.maxImageWidth || 720)))
      } else {
        await event.reply([
          segment.text(`图床上传成功：${result.provider} · ${result.cost}ms\n`),
          segment.image(result.url),
        ])
      }
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

logger.info('[imagebed] 指令已注册: #图床 / #测试图床')
