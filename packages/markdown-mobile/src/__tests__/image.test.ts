import * as notify from 'notify'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getImageAttrsById,
  isEmptyParagraphJSON,
  removeImageById,
  setImage,
  updateImageById,
} from '../operate/image'
import { makeEditor } from './helpers'

/** 深扫 doc，收集所有 image 节点 */
function imageNodes(editor: { getJSON: () => any }) {
  const out: any[] = []
  const walk = (node: any) => {
    if (!node || typeof node !== 'object')
      return
    if (node.type === 'image')
      out.push(node)
    if (Array.isArray(node.content))
      node.content.forEach(walk)
  }
  walk(editor.getJSON())
  return out
}

/** 取文档顶层子节点（doc.content） */
function topChildren(editor: { getJSON: () => any }) {
  return editor.getJSON().content ?? []
}

describe('image operations', () => {
  let spy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    spy = vi.spyOn(notify, 'notifyNative').mockImplementation(() => {})
  })

  afterEach(() => {
    spy.mockRestore()
  })

  it('isEmptyParagraphJSON', () => {
    expect(isEmptyParagraphJSON({ type: 'paragraph' })).toBe(true)
    expect(isEmptyParagraphJSON({ type: 'paragraph', content: [{ type: 'text', text: '  ' }] })).toBe(true)
    expect(isEmptyParagraphJSON({ type: 'paragraph', content: [{ type: 'text', text: 'x' }] })).toBe(false)
    expect(isEmptyParagraphJSON({ type: 'heading' })).toBe(false)
  })

  it('at=top prepends images and dedups header images', async () => {
    const { editor, cleanup } = makeEditor('<p></p>')
    await setImage(editor, { at: 'top', images: [{ src: 'a.png' }, { src: 'b.png' }] })
    expect(imageNodes(editor)).toHaveLength(2)
    /** 再次插入顶部 → 之前的头部图片应被替换 */
    await setImage(editor, { at: 'top', images: [{ src: 'c.png' }] })
    const top = topChildren(editor)
    /** 顶层第一个是图片段落，其内唯一 image 为 c.png */
    expect(top[0].type).toBe('paragraph')
    expect(top[0].content?.[0]?.type).toBe('image')
    expect(top[0].content?.[0]?.attrs?.src).toBe('c.png')
    expect(imageNodes(editor)).toHaveLength(1)
    cleanup()
  })

  it('at=bottom appends images and replaces footer images', async () => {
    const { editor, cleanup } = makeEditor('<p>hi</p>')
    await setImage(editor, { at: 'bottom', images: [{ src: 'a.png' }, { src: 'b.png' }] })
    expect(imageNodes(editor)).toHaveLength(2)
    await setImage(editor, { at: 'bottom', images: [{ src: 'c.png' }] })
    const imgs = imageNodes(editor)
    expect(imgs).toHaveLength(1)
    expect(imgs[0].attrs?.src).toBe('c.png')
    cleanup()
  })

  it('at=top removes leading empty paragraph', async () => {
    const { editor, cleanup } = makeEditor('<p></p><p>hi</p>')
    await setImage(editor, { at: 'top', images: [{ src: 'a.png' }] })
    const top = topChildren(editor)
    /** 首段为图片段落，第二段为 "hi"（空段落被丢弃） */
    expect(top[0].content?.[0]?.type).toBe('image')
    expect(top[1].type).toBe('paragraph')
    expect((top[1].content?.[0] as any)?.text).toBe('hi')
    cleanup()
  })

  it('at=cursor inserts at cursor', async () => {
    const { editor, cleanup } = makeEditor('<p>hello</p>')
    editor.commands.setTextSelection(6)
    await setImage(editor, { at: 'cursor', images: [{ src: 'a.png' }] })
    expect(imageNodes(editor)).toHaveLength(1)
    cleanup()
  })

  it('default preset=block applies block visuals', async () => {
    const { editor, cleanup } = makeEditor('<p></p>')
    await setImage(editor, { at: 'top', images: [{ src: 'a.png' }] })
    const { attrs } = imageNodes(editor)[0]
    expect(attrs.display).toBe('block')
    expect(attrs.borderRadius).toBe('8px')
    expect(attrs.margin).toBe('0.5rem 0.1rem')
    cleanup()
  })

  it('preset=inline applies inline visuals', async () => {
    const { editor, cleanup } = makeEditor('<p></p>')
    await setImage(editor, { at: 'cursor', preset: 'inline', images: [{ src: 'a.png' }] })
    const { attrs } = imageNodes(editor)[0]
    expect(attrs.display).toBe('inline')
    expect(attrs.height).toBe('1em')
    expect(attrs.verticalAlign).toBe('middle')
    cleanup()
  })

  it('per-item attrs override preset', async () => {
    const { editor, cleanup } = makeEditor('<p></p>')
    await setImage(editor, {
      at: 'cursor',
      preset: 'block',
      images: [{ src: 'a.png', borderRadius: '16px', width: 320 }],
    })
    const { attrs } = imageNodes(editor)[0]
    expect(attrs.borderRadius).toBe('16px')
    expect(attrs.width).toBe(320)
    /** 未覆盖的字段仍走预设 */
    expect(attrs.margin).toBe('0.5rem 0.1rem')
    cleanup()
  })

  it('notifies imageInserted on success (payload carries ids, no srcs)', async () => {
    const { editor, cleanup } = makeEditor('')
    await setImage(editor, { at: 'top', images: [{ src: 'a.png', id: 'native-id-1' }] })
    expect(spy).toHaveBeenCalledWith('imageInserted', expect.objectContaining({
      at: 'top',
      preset: 'block',
      ids: ['native-id-1'],
    }))
    /** 不应携带 srcs / count，避免 base64 搬运 */
    const payload = spy.mock.calls.find(c => c[0] === 'imageInserted')![1]
    expect(payload).not.toHaveProperty('srcs')
    cleanup()
  })

  it('setImage auto-generates id when caller does not provide', async () => {
    const { editor, cleanup } = makeEditor('')
    await setImage(editor, { at: 'top', images: [{ src: 'a.png' }] })
    const attrs = imageNodes(editor)[0].attrs
    expect(typeof attrs.id).toBe('string')
    expect(attrs.id.length).toBeGreaterThan(0)
    cleanup()
  })

  it('caller-provided id is preserved through insertion', async () => {
    const { editor, cleanup } = makeEditor('')
    await setImage(editor, { at: 'cursor', images: [{ src: 'a.png', id: 'stable-123' }] })
    expect(imageNodes(editor)[0].attrs.id).toBe('stable-123')
    cleanup()
  })

  it('getImageAttrsById returns full attrs or null', async () => {
    const { editor, cleanup } = makeEditor('')
    await setImage(editor, { at: 'cursor', images: [{ src: 'a.png', id: 'x' }] })
    const attrs = getImageAttrsById(editor, 'x')
    expect(attrs?.src).toBe('a.png')
    expect(attrs?.id).toBe('x')
    expect(getImageAttrsById(editor, 'not-exist')).toBeNull()
    cleanup()
  })

  it('updateImageById patches attrs, preserves id', async () => {
    const { editor, cleanup } = makeEditor('')
    await setImage(editor, { at: 'cursor', images: [{ src: 'a.png', id: 'x' }] })
    const ok = await updateImageById(editor, 'x', { width: 320, borderRadius: '12px' })
    expect(ok).toBe(true)
    const attrs = getImageAttrsById(editor, 'x')
    expect(attrs?.width).toBe(320)
    expect(attrs?.borderRadius).toBe('12px')
    expect(attrs?.id).toBe('x')
    /** 未传字段保持原值 */
    expect(attrs?.src).toBe('a.png')
    cleanup()
  })

  it('updateImageById returns false for unknown id', async () => {
    const { editor, cleanup } = makeEditor('')
    await setImage(editor, { at: 'cursor', images: [{ src: 'a.png', id: 'x' }] })
    expect(await updateImageById(editor, 'not-exist', { width: 1 })).toBe(false)
    cleanup()
  })

  it('removeImageById deletes the node by id', async () => {
    const { editor, cleanup } = makeEditor('')
    await setImage(editor, {
      at: 'top',
      images: [{ src: 'a.png', id: 'a' }, { src: 'b.png', id: 'b' }],
    })
    expect(imageNodes(editor)).toHaveLength(2)
    const ok = await removeImageById(editor, 'a')
    expect(ok).toBe(true)
    const remaining = imageNodes(editor)
    expect(remaining).toHaveLength(1)
    expect(remaining[0].attrs.id).toBe('b')
    cleanup()
  })

  it('removeImageById returns false for unknown id', async () => {
    const { editor, cleanup } = makeEditor('')
    await setImage(editor, { at: 'cursor', images: [{ src: 'a.png', id: 'x' }] })
    expect(await removeImageById(editor, 'not-exist')).toBe(false)
    cleanup()
  })

  it('empty images list triggers imageInsertError and does not throw', async () => {
    const { editor, cleanup } = makeEditor('<p>hi</p>')
    await setImage(editor, { at: 'cursor', images: [] })
    expect(imageNodes(editor)).toHaveLength(0)
    expect(spy).toHaveBeenCalledWith('imageInsertError', expect.objectContaining({
      error: 'images is empty',
    }))
    cleanup()
  })
})
