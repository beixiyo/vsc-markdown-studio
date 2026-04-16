import { afterEach, describe, expect, it } from 'vitest'
import { LocalStorageEngine } from '../storage/local-storage-engine'

describe('localStorageEngine', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('save and load round-trip', async () => {
    const engine = new LocalStorageEngine({ keyPrefix: 'test_' })
    await engine.save('hello', 'key1')
    expect(await engine.load('key1')).toBe('hello')
  })

  it('load returns null for missing key', async () => {
    const engine = new LocalStorageEngine()
    expect(await engine.load('missing')).toBeNull()
  })

  it('exists returns true after save, false after remove', async () => {
    const engine = new LocalStorageEngine({ keyPrefix: 'e_' })
    await engine.save('data', 'k')
    expect(await engine.exists('k')).toBe(true)
    await engine.remove('k')
    expect(await engine.exists('k')).toBe(false)
  })

  it('clear removes only prefixed keys', async () => {
    const engine = new LocalStorageEngine({ keyPrefix: 'app_' })
    await engine.save('a', 'k1')
    await engine.save('b', 'k2')
    localStorage.setItem('other', 'keep')
    await engine.clear()
    expect(await engine.load('k1')).toBeNull()
    expect(localStorage.getItem('other')).toBe('keep')
  })

  it('getAllKeys lists non-expired keys', async () => {
    const engine = new LocalStorageEngine({ keyPrefix: 'gak_' })
    await engine.save('a', 'one')
    await engine.save('b', 'two')
    const keys = await engine.getAllKeys()
    expect(keys.sort()).toEqual(['one', 'two'])
  })

  it('getMetadata returns metadata with timestamps', async () => {
    const engine = new LocalStorageEngine({ keyPrefix: 'meta_' })
    await engine.save('content', 'k')
    const meta = await engine.getMetadata('k')
    expect(meta).not.toBeNull()
    expect(meta!.createdAt).toBeGreaterThan(0)
    expect(meta!.updatedAt).toBeGreaterThan(0)
  })

  it('update preserves createdAt but refreshes updatedAt', async () => {
    const engine = new LocalStorageEngine({ keyPrefix: 'up_' })
    await engine.save('v1', 'k')
    const meta1 = await engine.getMetadata('k')
    await engine.save('v2', 'k')
    const meta2 = await engine.getMetadata('k')
    expect(meta2!.createdAt).toBe(meta1!.createdAt)
    expect(meta2!.updatedAt).toBeGreaterThanOrEqual(meta1!.updatedAt)
  })

  it('expired items return null on load', async () => {
    const engine = new LocalStorageEngine({ keyPrefix: 'exp_', expiration: 1 })
    await engine.save('data', 'k')
    await new Promise(r => setTimeout(r, 10))
    expect(await engine.load('k')).toBeNull()
    expect(await engine.exists('k')).toBe(false)
  })
})
