export function formatDuration(ms = 0) {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`
}

import { createProviders } from './providers/index.js'
import { loadConfig } from './config.js'
import { recordUpload } from './stats.js'

export function createImageBedService(config = loadConfig()) {
  const service = {
    providers: createProviders(config),
    async upload(input, options = {}) {
      const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input)
      const name = options.name || 'image.png'
      const selected = options.provider
        ? [service.providers.get(options.provider)].filter(Boolean)
        : (config.priority || []).map((key) => service.providers.get(key)).filter(Boolean)
      const candidates = selected.filter((provider) => provider.enabled)
      if (!candidates.length) throw new Error('没有启用的图床')
      const errors = []
      for (const provider of candidates) {
        const started = Date.now()
        try {
          const url = await provider.upload(buffer, name, options)
          const cost = Date.now() - started
          recordUpload({ provider: provider.configKey, success: true, cost, size: buffer.length })
          return { url, provider: provider.configKey, cost }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          recordUpload({ provider: provider.configKey, success: false, cost: Date.now() - started, size: buffer.length, error: message })
          errors.push(`${provider.name}: ${message}`)
        }
      }
      throw new Error(`所有图床均失败（${errors.join('；')}）`)
    },
  }
  return service
}
