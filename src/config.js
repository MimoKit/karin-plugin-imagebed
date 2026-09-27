import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const PLUGIN_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const CONFIG_PATH = path.join(PLUGIN_ROOT, 'config', 'config.json')

/** 全部 provider 键，供配置页与优先级校验复用。 */
export const PROVIDER_KEYS = ['cnb', 'picgo', 'cliim', 'kurobbs', 'bilibili']

const DEFAULT_CONFIG = {
  priority: ['cnb', 'picgo', 'cliim', 'kurobbs', 'bilibili'],
  stats: { enabled: true, maxDays: 30 },
  markdown: { enabled: true, maxImageWidth: 720, fallbackText: true },
  providers: {
    cnb: { enabled: false, token: '', repo: '' },
    picgo: { enabled: false, apiKey: '' },
    cliim: { enabled: true },
    kurobbs: { enabled: false, token: '' },
    bilibili: { enabled: false, csrfToken: '', sessdata: '', bucket: 'openplatform' },
  },
}

const asBool = (value, fallback) => {
  if (value === undefined || value === null || value === '') return fallback
  if (typeof value === 'boolean') return value
  const text = String(value).trim().toLowerCase()
  if (['true', '1', 'on', 'yes'].includes(text)) return true
  if (['false', '0', 'off', 'no'].includes(text)) return false
  return fallback
}

const asInt = (value, fallback, min, max) => {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(Math.max(parsed, min), max)
}

let cached

export function loadConfig() {
  if (cached) return cached
  let input = {}
  try {
    if (fs.existsSync(CONFIG_PATH)) input = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'))
  } catch {
    input = {}
  }
  const providers = input.providers || {}
  cached = {
    ...structuredClone(DEFAULT_CONFIG),
    ...input,
    stats: { ...DEFAULT_CONFIG.stats, ...(input.stats || {}) },
    markdown: { ...DEFAULT_CONFIG.markdown, ...(input.markdown || {}) },
    providers: {
      cnb: { ...DEFAULT_CONFIG.providers.cnb, ...(providers.cnb || {}) },
      picgo: { ...DEFAULT_CONFIG.providers.picgo, ...(providers.picgo || {}) },
      cliim: { ...DEFAULT_CONFIG.providers.cliim, ...(providers.cliim || {}) },
      kurobbs: { ...DEFAULT_CONFIG.providers.kurobbs, ...(providers.kurobbs || {}) },
      bilibili: { ...DEFAULT_CONFIG.providers.bilibili, ...(providers.bilibili || {}) },
    },
  }
  return cached
}

export function reloadConfig() {
  cached = undefined
  return loadConfig()
}

/**
 * 保存控制台提交的扁平表单。
 *
 * Karin 配置页提交的是 `{ key: value }` 扁平对象，
 * 这里按 provider 前缀还原成嵌套配置结构，并做取值校验。
 */
export function saveConfig(input = {}) {
  const current = loadConfig()
  const value = (key) => input[key]
  const has = (key) => Object.prototype.hasOwnProperty.call(input, key)

  const next = structuredClone(current)

  if (has('priority')) {
    const list = String(value('priority') || '')
      .split(/[,，\s]+/)
      .map((item) => item.trim())
      .filter((item) => PROVIDER_KEYS.includes(item))
    next.priority = [...new Set(list)]
    if (!next.priority.length) next.priority = [...DEFAULT_CONFIG.priority]
  }

  if (has('markdown_enabled')) next.markdown.enabled = asBool(value('markdown_enabled'), next.markdown.enabled)
  if (has('markdown_maxImageWidth')) next.markdown.maxImageWidth = asInt(value('markdown_maxImageWidth'), next.markdown.maxImageWidth, 120, 2000)

  for (const key of PROVIDER_KEYS) {
    if (has(`${key}_enabled`)) next.providers[key].enabled = asBool(value(`${key}_enabled`), next.providers[key].enabled)
  }

  const text = (key, target, field) => {
    if (has(key)) target[field] = String(value(key) ?? '').trim()
  }
  text('cnb_token', next.providers.cnb, 'token')
  text('cnb_repo', next.providers.cnb, 'repo')
  text('picgo_apiKey', next.providers.picgo, 'apiKey')
  text('kurobbs_token', next.providers.kurobbs, 'token')
  text('bilibili_sessdata', next.providers.bilibili, 'sessdata')
  text('bilibili_csrfToken', next.providers.bilibili, 'csrfToken')
  if (has('bilibili_bucket')) {
    const bucket = String(value('bilibili_bucket') || '').trim()
    next.providers.bilibili.bucket = bucket || DEFAULT_CONFIG.providers.bilibili.bucket
  }

  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true })
  fs.writeFileSync(CONFIG_PATH, `${JSON.stringify(next, null, 2)}\n`, 'utf8')
  cached = next
  return next
}
