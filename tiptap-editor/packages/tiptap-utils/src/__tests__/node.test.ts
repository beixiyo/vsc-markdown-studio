import { describe, expect, it } from 'vitest'
import { isValidPosition } from '../utils/node'

describe('isValidPosition', () => {
  it('returns true for zero and positive numbers', () => {
    expect(isValidPosition(0)).toBe(true)
    expect(isValidPosition(1)).toBe(true)
    expect(isValidPosition(999)).toBe(true)
  })

  it('returns false for negative numbers', () => {
    expect(isValidPosition(-1)).toBe(false)
  })

  it('returns false for null / undefined / NaN', () => {
    expect(isValidPosition(null)).toBe(false)
    expect(isValidPosition(undefined)).toBe(false)
    expect(isValidPosition(Number.NaN)).toBe(false)
  })
})
