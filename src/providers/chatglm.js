import { ImageProvider } from './base.js'

/**
 * ChatGLM 图床（智谱，免费）。
 *
 * 实测可用，上传后返回带签名的公网直链，适合作为默认图床。
 * 链接带 expired_at 有效期，属临时链接。
 */
export class ChatglmProvider extends ImageProvider {
  constructor(config = {}) { super('chatglm', 'ChatGLM', config) }

  async upload(buffer, name = 'image.png') {
    if (buffer.length > 20 * 1024 * 1024) throw new Error('ChatGLM 单文件不能超过 20MB')
    const form = new FormData()
    form.append('file', new Blob([buffer]), name)
    const response = await fetch('https://chatglm.cn/chatglm/backend-api/assistant/file_upload', {
      method: 'POST',
      body: form,
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(this.config.timeout || 30000),
    })
    const data = await response.json().catch(() => ({}))
    const url = data?.result?.file_url
    if (!response.ok || !url) throw new Error(data?.message || `ChatGLM HTTP ${response.status}`)
    return url
  }
}
