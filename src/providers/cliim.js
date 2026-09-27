import { ImageProvider } from './base.js'

export class CliimProvider extends ImageProvider {
  constructor(config = {}) { super('cliim', 'Cli.im', config) }
  async upload(buffer, name = 'image.png') {
    const form = new FormData()
    form.append('file', new Blob([buffer]), name)
    const response = await fetch('https://cli.im/api/upload', { method: 'POST', body: form, signal: AbortSignal.timeout(30000) })
    if (!response.ok) throw new Error(`Cli.im HTTP ${response.status}`)
    const data = await response.json()
    const url = data?.data?.url || data?.url || data?.data?.image_url
    if (!url) throw new Error('Cli.im 未返回图片地址')
    return url
  }
}
