import { describe, expect, it } from 'vitest'
import { formatDate } from '../utils/date'

describe('formatDate', () => {
  const ts = new Date(2025, 0, 15, 14, 30).getTime()

  it('formats in zh-CN by default', () => {
    const result = formatDate(ts)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('formats in en-US when specified', () => {
    const result = formatDate(ts, 'en-US')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('treats unknown language as en-US', () => {
    const result = formatDate(ts, 'ja-JP')
    expect(typeof result).toBe('string')
  })
})
