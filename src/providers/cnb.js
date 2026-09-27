import { ImageProvider, inspectImage } from './base.js'

export class CnbProvider extends ImageProvider {
  constructor(config = {}) { super('cnb', 'CNB', config) }
  async upload(buffer, name = 'image.png') {
    if (!this.config.token || !this.config.repo) throw new Error('CNB 未配置 token 或 repo')
    const info = await inspectImage(buffer, name)
    const api = 'https://api.cnb.cool'
    const response = await fetch(`${api}/${this.config.repo}/-/upload/imgs`, {
      method: 'POST',
      headers: { accept: 'application/json', authorization: `Bearer ${this.config.token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ name: `${Date.now()}_${name}`, size: buffer.length }),
      signal: AbortSignal.timeout(30000),
    })
    if (!response.ok) throw new Error(`CNB 获取上传地址失败 HTTP ${response.status}`)
    const upload = await response.json()
    const put = await fetch(upload.upload_url, { method: 'PUT', headers: { 'content-type': info.mime, 'content-length': String(buffer.length) }, body: buffer, signal: AbortSignal.timeout(60000) })
    if (!put.ok) throw new Error(`CNB 上传失败 HTTP ${put.status}`)
    const url = upload.assets?.url || upload.assets?.path
    if (!url) throw new Error('CNB 未返回图片地址')
    return url.startsWith('http') ? url : `https://cnb.cool${url}`
  }
}
