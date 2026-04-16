import { describe, expect, it } from 'vitest'
import { isMarkdownEqual, normalizeMarkdown } from '../operate/utils'

describe('normalizeMarkdown', () => {
  it('unifies line endings', () => {
    expect(normalizeMarkdown('a\r\nb')).toBe('a\nb')
  })

  it('collapses 3+ blank lines to 2', () => {
    expect(normalizeMarkdown('a\n\n\n\nb')).toBe('a\n\nb')
  })

  it('strips trailing whitespace per line', () => {
    expect(normalizeMarkdown('hello   \nworld\t')).toBe('hello\nworld')
  })

  it('trims leading/trailing whitespace', () => {
    expect(normalizeMarkdown('  \nhello\n  ')).toBe('hello')
  })

  it('handles combined cases', () => {
    const input = '  hello  \r\n\r\n\r\n\r\nworld  \n  '
    expect(normalizeMarkdown(input)).toBe('hello\n\nworld')
  })
})

describe('isMarkdownEqual', () => {
  it('equal after normalization', () => {
    expect(isMarkdownEqual('hello  \n', '  hello')).toBe(true)
  })

  it('not equal when content differs', () => {
    expect(isMarkdownEqual('hello', 'world')).toBe(false)
  })

  it('treats multiple blank lines as equivalent', () => {
    expect(isMarkdownEqual('a\n\n\n\nb', 'a\n\nb')).toBe(true)
  })
})
