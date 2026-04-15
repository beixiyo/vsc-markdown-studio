import { describe, expect, it } from 'vitest'
import { useSetupMDBridge } from '../hooks/useSetupMDBridge'
import { makeEditor } from './helpers'
import { renderHook } from './react-hook-helper'

describe('useSetupMDBridge', () => {
  it('setBottomMargin writes paddingBottom on the container, clamps invalid input to 0', () => {
    const { editor, el, cleanup } = makeEditor('<p>hi</p>')
    const ref = { current: el }
    const dispose = renderHook(() => useSetupMDBridge(editor, ref))

    window.MDBridge.setBottomMargin(120)
    expect(el.style.paddingBottom).toBe('120px')

    window.MDBridge.setBottomMargin(-50)
    expect(el.style.paddingBottom).toBe('0px')

    window.MDBridge.setBottomMargin(Number.NaN)
    expect(el.style.paddingBottom).toBe('0px')

    dispose()
    cleanup()
  })
})
