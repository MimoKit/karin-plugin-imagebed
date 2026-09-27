import crypto from 'node:crypto'
import { ImageProvider } from './base.js'

export class BilibiliProvider extends ImageProvider {
  constructor(config = {}) { super('bilibili', 'B 站', config) }
  async upload(buffer, name = 'image.png') {
    if (!this.config.csrfToken || !this.config.sessdata) throw new Error('B站 Cookie 未配置')
    if (buffer.length > 20 * 1024 * 1024) throw new Error('B站单文件不能超过 20MB')
    const form = new FormData()
    form.append('file', new Blob([buffer]), name)
    form.append('bucket', this.config.bucket || 'openplatform')
    form.append('csrf', this.config.csrfToken)
    const response = await fetch('https://api.bilibili.com/x/upload/web/image', {
      method: 'POST', body: form,
      headers: { Cookie: `SESSDATA=${this.config.sessdata}; bili_jct=${this.config.csrfToken}` },
      signal: AbortSignal.timeout(30000),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok || data?.code !== 0 || !data?.data?.location) throw new Error(`B站上传失败 code=${data?.code ?? response.status}`)
    return String(data.data.location).replace(/^http:/, 'https:')
  }
}
