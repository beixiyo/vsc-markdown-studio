import { describe, expect, it } from 'vitest'
import { isAllowedUri, normalizeLinkUrl, sanitizeUrl } from '../utils/url'

describe('isAllowedUri', () => {
  it('allows standard protocols', () => {
    expect(isAllowedUri('http://example.com')).toBeTruthy()
    expect(isAllowedUri('https://example.com')).toBeTruthy()
    expect(isAllowedUri('mailto:a@b.com')).toBeTruthy()
    expect(isAllowedUri('tel:+1234567890')).toBeTruthy()
  })

  it('allows relative paths', () => {
    expect(isAllowedUri('/path/to/file')).toBeTruthy()
    expect(isAllowedUri('./relative')).toBeTruthy()
  })

  it('allows empty / undefined', () => {
    expect(isAllowedUri(undefined)).toBeTruthy()
    expect(isAllowedUri('')).toBeTruthy()
  })

  it('allows custom protocol via config', () => {
    expect(isAllowedUri('custom://app', ['custom'])).toBeTruthy()
    expect(isAllowedUri('app://open', [{ scheme: 'app' }])).toBeTruthy()
  })
})

describe('normalizeLinkUrl', () => {
  it('returns empty for blank input', () => {
    expect(normalizeLinkUrl('')).toBe('')
    expect(normalizeLinkUrl('   ')).toBe('')
  })

  it('keeps existing protocol', () => {
    expect(normalizeLinkUrl('https://x.com')).toBe('https://x.com')
    expect(normalizeLinkUrl('http://x.com')).toBe('http://x.com')
    expect(normalizeLinkUrl('mailto:a@b.com')).toBe('mailto:a@b.com')
  })

  it('prepends https to bare domain', () => {
    expect(normalizeLinkUrl('example.com')).toBe('https://example.com')
    expect(normalizeLinkUrl('example.com/path')).toBe('https://example.com/path')
  })

  it('keeps relative paths as-is', () => {
    expect(normalizeLinkUrl('/foo')).toBe('/foo')
    expect(normalizeLinkUrl('./bar')).toBe('./bar')
    expect(normalizeLinkUrl('../baz')).toBe('../baz')
  })
})

describe('sanitizeUrl', () => {
  it('returns normalized URL for valid input', () => {
    const result = sanitizeUrl('example.com', 'https://base.com')
    expect(result).toBe('https://example.com/')
  })

  it('returns # for empty input', () => {
    expect(sanitizeUrl('', 'https://base.com')).toBe('#')
  })

  it('preserves full URLs', () => {
    expect(sanitizeUrl('https://x.com/path', 'https://base.com')).toBe('https://x.com/path')
  })
})
