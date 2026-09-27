import { fileTypeFromBuffer } from 'file-type'

export class ImageProvider {
  constructor(configKey, name, config = {}) { this.configKey = configKey; this.name = name; this.config = config }
  get enabled() { return this.config.enabled === true }
  async upload() { throw new Error(`${this.name} 尚未实现`) }
}

export async function inspectImage(buffer, name = 'image.png') {
  const type = await fileTypeFromBuffer(buffer)
  return { mime: type?.mime || 'application/octet-stream', ext: type?.ext || name.split('.').pop() || 'bin' }
}
