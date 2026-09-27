import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { CONFIG_PATH, PROVIDER_KEYS, loadConfig, reloadConfig, saveConfig } from '../src/config.js'

const backup = fs.existsSync(CONFIG_PATH) ? fs.readFileSync(CONFIG_PATH, 'utf8') : null

test.after(() => {
  if (backup === null) fs.rmSync(CONFIG_PATH, { force: true })
  else fs.writeFileSync(CONFIG_PATH, backup, 'utf8')
  reloadConfig()
})

test('saveConfig maps flat console form into nested config', () => {
  saveConfig({
    priority: 'cliim, cnb',
    markdown_enabled: false,
    markdown_maxImageWidth: '900',
    cnb_enabled: true,
    cnb_token: 'tok',
    cnb_repo: 'me/repo',
    bilibili_bucket: 'draw',
  })
  const config = loadConfig()
  assert.deepEqual(config.priority, ['cliim', 'cnb'])
  assert.equal(config.markdown.enabled, false)
  assert.equal(config.markdown.maxImageWidth, 900)
  assert.equal(config.providers.cnb.enabled, true)
  assert.equal(config.providers.cnb.token, 'tok')
  assert.equal(config.providers.bilibili.bucket, 'draw')
})

test('saveConfig drops unknown providers and clamps width', () => {
  saveConfig({ priority: 'cnb, hacker, cliim', markdown_maxImageWidth: '99999' })
  const config = loadConfig()
  assert.deepEqual(config.priority, ['cnb', 'cliim'])
  assert.equal(config.markdown.maxImageWidth, 2000)
  for (const key of config.priority) assert.ok(PROVIDER_KEYS.includes(key))
})

test('partial save keeps other provider settings', () => {
  saveConfig({ picgo_apiKey: 'secret-key' })
  saveConfig({ cliim_enabled: false })
  const config = loadConfig()
  assert.equal(config.providers.picgo.apiKey, 'secret-key')
  assert.equal(config.providers.cliim.enabled, false)
})
