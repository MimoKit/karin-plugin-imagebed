import { BilibiliProvider } from './bilibili.js'
import { ChatglmProvider } from './chatglm.js'
import { CnbProvider } from './cnb.js'
import { CliimProvider } from './cliim.js'
import { KurobbsProvider } from './kurobbs.js'
import { PicgoProvider } from './picgo.js'

export function createProviders(config) {
  const settings = config.providers || {}
  return new Map([
    ['cnb', new CnbProvider(settings.cnb || {})],
    ['picgo', new PicgoProvider(settings.picgo || {})],
    ['chatglm', new ChatglmProvider(settings.chatglm || {})],
    ['cliim', new CliimProvider(settings.cliim || {})],
    ['kurobbs', new KurobbsProvider(settings.kurobbs || {})],
    ['bilibili', new BilibiliProvider(settings.bilibili || {})],
  ])
}
