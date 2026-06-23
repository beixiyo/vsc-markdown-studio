import { act } from 'react'
import * as notify from 'notify'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useNotifyChange } from '../hooks/useNotify'
import { makeEditor } from './helpers'
import { renderHook } from './react-hook-helper'

describe('useNotifyChange', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverStub)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('contentChanged 使用结构化载荷上报用户编辑上下文', async () => {
    vi.useFakeTimers()
    const spy = vi.spyOn(notify, 'notifyNative').mockImplementation(() => {})
    const { editor, el, cleanup } = makeEditor('<p>a</p>')
    const ref = { current: el }
    const dispose = renderHook(() => useNotifyChange(editor, ref))

    act(() => {
      editor.commands.insertContent('b')
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })

    const call = spy.mock.calls.find(([event]) => event === 'contentChanged')
    expect(call?.[1]).toMatchObject({
      format: 'markdown',
      context: {
        source: 'user',
        reason: 'typing',
        shouldPersist: true,
      },
    })
    expect(call?.[1].content).toContain('b')

    dispose()
    cleanup()
  })

  it('非正文 update 不触发 contentChanged', async () => {
    vi.useFakeTimers()
    const spy = vi.spyOn(notify, 'notifyNative').mockImplementation(() => {})
    const { editor, el, cleanup } = makeEditor('<p>a</p>')
    const ref = { current: el }
    const dispose = renderHook(() => useNotifyChange(editor, ref))

    act(() => {
      editor.setEditable(false)
      editor.setEditable(true)
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })

    expect(spy.mock.calls.some(([event]) => event === 'contentChanged')).toBe(false)

    dispose()
    cleanup()
  })
})

class ResizeObserverStub {
  observe() {
    /** jsdom 环境只需要占位，不需要实际观察尺寸 */
  }

  disconnect() {
    /** jsdom 环境只需要占位，不需要实际清理观察器 */
  }
}
