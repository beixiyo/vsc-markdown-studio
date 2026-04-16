import { describe, expect, it } from 'vitest'
import { formatShortcutKey, MAC_SYMBOLS, parseShortcutKeys } from '../utils/platform'

describe('formatShortcutKey', () => {
  it('maps Mac modifier keys to symbols', () => {
    expect(formatShortcutKey('mod', true)).toBe('⌘')
    expect(formatShortcutKey('ctrl', true)).toBe('⌃')
    expect(formatShortcutKey('alt', true)).toBe('⌥')
    expect(formatShortcutKey('shift', true)).toBe('⇧')
  })

  it('uppercases unknown keys on Mac', () => {
    expect(formatShortcutKey('a', true)).toBe('A')
    expect(formatShortcutKey('z', true)).toBe('Z')
  })

  it('capitalizes first letter on non-Mac', () => {
    expect(formatShortcutKey('ctrl', false)).toBe('Ctrl')
    expect(formatShortcutKey('alt', false)).toBe('Alt')
    expect(formatShortcutKey('shift', false)).toBe('Shift')
  })

  it('respects capitalize=false', () => {
    expect(formatShortcutKey('a', true, false)).toBe('a')
    expect(formatShortcutKey('ctrl', false, false)).toBe('ctrl')
  })
})

describe('mAC_SYMBOLS', () => {
  it('has common modifiers', () => {
    expect(MAC_SYMBOLS.mod).toBe('⌘')
    expect(MAC_SYMBOLS.alt).toBe('⌥')
    expect(MAC_SYMBOLS.shift).toBe('⇧')
    expect(MAC_SYMBOLS.enter).toBe('⏎')
  })
})

describe('parseShortcutKeys', () => {
  it('returns empty for undefined', () => {
    expect(parseShortcutKeys({ shortcutKeys: undefined })).toEqual([])
  })

  it('splits by default + delimiter', () => {
    const result = parseShortcutKeys({ shortcutKeys: 'ctrl+a' })
    expect(result).toHaveLength(2)
  })

  it('splits by custom delimiter', () => {
    const result = parseShortcutKeys({ shortcutKeys: 'ctrl-shift-a', delimiter: '-' })
    expect(result).toHaveLength(3)
  })
})
