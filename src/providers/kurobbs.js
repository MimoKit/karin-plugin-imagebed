import { ImageProvider, inspectImage } from './base.js'

export class KurobbsProvider extends ImageProvider {
  constructor(config = {}) { super('kurobbs', '库街区', config) }
  async upload(buffer, name = 'image.png') {
    if (!this.config.token) throw new Error('库街区 Token 未配置')
    const info = await inspectImage(buffer, name)
    const form = new FormData()
    form.append('files', new File([buffer], name, { type: info.mime }))
    const response = await fetch('https://api.kurobbs.com/forum/uploadForumImgForH5', {
      method: 'POST', body: form,
      headers: { source: 'h5', Referer: 'http://www.kurobbs.com/', Token: this.config.token },
      signal: AbortSignal.timeout(30000),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(`库街区 HTTP ${response.status}`)
    const url = Array.isArray(data?.data) ? data.data[0] : data?.data
    if (!url) throw new Error('库街区未返回图片地址')
    return url
  }
}
