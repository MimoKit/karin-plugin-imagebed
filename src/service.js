export function formatDuration(ms = 0) {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`
}

import { createProviders } from './providers/index.js'
import { loadConfig } from './config.js'

export function createImageBedService(config = loadConfig()) {
  const providers = createProviders(config)
  return {
    providers,
    async upload(input, options = {}) {
      const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input)
      const name = options.name || 'image.png'
      const selected = options.provider
        ? [providers.get(options.provider)].filter(Boolean)
        : (config.priority || []).map((key) => providers.get(key)).filter(Boolean)
      const candidates = selected.filter((provider) => provider.enabled)
      if (!candidates.length) throw new Error('没有启用的图床')
      const errors = []
      for (const provider of candidates) {
        const started = Date.now()
        try {
          return { url: await provider.upload(buffer, name, options), provider: provider.configKey, cost: Date.now() - started }
        } catch (error) {
          errors.push(`${provider.name}: ${error instanceof Error ? error.message : String(error)}`)
        }
      }
      throw new Error(`所有图床均失败（${errors.join('；')}）`)
    },
  }
}
