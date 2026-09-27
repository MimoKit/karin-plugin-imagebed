import { ImageProvider, inspectImage } from './base.js'

export class PicgoProvider extends ImageProvider {
  constructor(config = {}) { super('picgo', 'PicGo', config) }
  async upload(buffer, name = 'image.png') {
    if (buffer.length > 25 * 1024 * 1024) throw new Error('PicGo 单文件不能超过 25MB')
    const info = await inspectImage(buffer, name)
    const form = new FormData()
    form.append('source', new File([buffer], name, { type: info.mime }))
    const headers = this.config.apiKey ? { 'X-API-Key': this.config.apiKey } : {}
    const response = await fetch('https://www.picgo.net/api/1/upload', { method: 'POST', headers, body: form, signal: AbortSignal.timeout(30000) })
    const data = await response.json().catch(() => ({}))
    if (!response.ok || data.status_code !== 200 || !data.image?.url) throw new Error(data?.error?.message || `PicGo HTTP ${response.status}`)
    return data.image.url
  }
}
