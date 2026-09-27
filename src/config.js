import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const PLUGIN_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const CONFIG_PATH = path.join(PLUGIN_ROOT, 'config', 'config.json')

const DEFAULT_CONFIG = {
  priority: ['cnb', 'picgo', 'cliim'],
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

let cached
export function loadConfig() {
  if (cached) return cached
  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true })
  if (!fs.existsSync(CONFIG_PATH)) fs.writeFileSync(CONFIG_PATH, `${JSON.stringify(DEFAULT_CONFIG, null, 2)}\n`, 'utf8')
  try {
    const input = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'))
    cached = {
      ...structuredClone(DEFAULT_CONFIG), ...input,
      stats: { ...DEFAULT_CONFIG.stats, ...(input.stats || {}) },
      markdown: { ...DEFAULT_CONFIG.markdown, ...(input.markdown || {}) },
      providers: { ...DEFAULT_CONFIG.providers, ...(input.providers || {}) },
    }
  } catch {
    cached = structuredClone(DEFAULT_CONFIG)
  }
  return cached
}
export function reloadConfig() { cached = undefined; return loadConfig() }
