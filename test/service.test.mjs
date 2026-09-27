import test from 'node:test'
import assert from 'node:assert/strict'

import { createImageBedService } from '../src/service.js'

function provider(key, enabled, result) {
  return { configKey: key, name: key, enabled, upload: async () => result }
}

test('service follows priority and skips disabled providers', async () => {
  const service = createImageBedService({ priority: ['dead', 'live'], providers: {} })
  service.providers = new Map([
    ['dead', provider('dead', false, 'unused')],
    ['live', provider('live', true, 'https://example.com/image.png')],
  ])
  const result = await service.upload(Buffer.from('image'), { name: 'a.png' })
  assert.equal(result.url, 'https://example.com/image.png')
  assert.equal(result.provider, 'live')
})

test('service falls back after provider failure', async () => {
  const service = createImageBedService({ priority: ['first', 'second'], providers: {} })
  service.providers = new Map([
    ['first', { ...provider('first', true), upload: async () => { throw new Error('offline') } }],
    ['second', provider('second', true, 'https://example.com/ok.png')],
  ])
  const result = await service.upload(Buffer.from('image'))
  assert.equal(result.provider, 'second')
})
