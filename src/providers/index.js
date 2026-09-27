import { CnbProvider } from './cnb.js'
import { CliimProvider } from './cliim.js'
import { PicgoProvider } from './picgo.js'

export function createProviders(config) {
  const settings = config.providers || {}
  return new Map([
    ['cnb', new CnbProvider(settings.cnb || {})],
    ['picgo', new PicgoProvider(settings.picgo || {})],
    ['cliim', new CliimProvider(settings.cliim || {})],
  ])
}
