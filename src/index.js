import { logger } from 'node-karin'

import { loadConfig } from './config.js'
import { createImageBedService } from './service.js'

const config = loadConfig()
const service = createImageBedService(config)

/** 供同一 Karin 进程内其他插件调用的统一图床服务。 */
globalThis.KarinImageBed = service

logger.info(
  `[imagebed] 已加载 · 优先级 ${config.priority.join(' → ')} · 可用 ${[...service.providers.values()]
    .filter((provider) => provider.enabled)
    .map((provider) => provider.name)
    .join(', ') || '无'}`,
)

export { service }
