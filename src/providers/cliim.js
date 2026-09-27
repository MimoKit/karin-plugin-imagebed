import crypto from 'node:crypto'
import { ImageProvider } from './base.js'

export class CliimProvider extends ImageProvider {
  constructor(config = {}) { super('cliim', 'Cli.im', config) }
  async upload(buffer, name = 'image.png') {
    if (!Buffer.isBuffer(buffer) || !buffer.length) throw new Error('Cli.im 图片数据为空')
    const boundary = `----KarinImageBed${crypto.randomBytes(8).toString('hex')}`
    const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : '.jpg'
    const filename = `${crypto.createHash('md5').update(buffer).digest('hex')}${ext}`
    const head = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="Filedata"; filename="${filename}"\r\nContent-Type: image/jpeg\r\n\r\n`)
    const tail = Buffer.from(`\r\n--${boundary}--\r\n`)
    const response = await fetch('https://upload.api.cli.im/upload.php?kid=cliim', {
      method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
      body: Buffer.concat([head, buffer, tail]),
      signal: AbortSignal.timeout(this.config.timeout || 30000),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok || data.status !== '1' || !data.data?.path) throw new Error(data.msg || `Cli.im HTTP ${response.status}`)
    return data.data.path
  }
}
