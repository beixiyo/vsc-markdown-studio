import * as notify from 'notify'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { appendAtCursor, insertAtBottom, insertAtTop, isEmptyParagraphJSON } from '../operate/image'
import { makeEditor } from './helpers'

function countImages(editor: { getJSON: () => any }) {
  const content = editor.getJSON().content ?? []
  return content.filter((n: any) => n.type === 'image').length
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

  it('insertAtTop prepends images and dedups header images', async () => {
    const { editor, cleanup } = makeEditor('<p></p>')
    await insertAtTop(editor, ['a.png', 'b.png'])
    expect(countImages(editor)).toBe(2)
    /** 再次插入顶部 → 之前的头部图片应被替换 */
    await insertAtTop(editor, ['c.png'])
    const json = editor.getJSON().content ?? []
    expect(json[0].type).toBe('image')
    expect(json[0].attrs?.src).toBe('c.png')
    expect(countImages(editor)).toBe(1)
    cleanup()
  })

  it('insertAtBottom appends images and replaces footer images', async () => {
    const { editor, cleanup } = makeEditor('<p>hi</p>')
    await insertAtBottom(editor, ['a.png', 'b.png'])
    expect(countImages(editor)).toBe(2)
    await insertAtBottom(editor, ['c.png'])
    const json = editor.getJSON().content ?? []
    /** ProseMirror 可能在末尾补空段落，取最后一张图片做断言 */
    const lastImage = [...json].reverse().find((n: any) => n.type === 'image')
    expect(lastImage?.attrs?.src).toBe('c.png')
    expect(countImages(editor)).toBe(1)
    cleanup()
  })

  it('insertAtTop removes leading empty paragraph', async () => {
    const { editor, cleanup } = makeEditor('<p></p><p>hi</p>')
    await insertAtTop(editor, ['a.png'])
    const json = editor.getJSON().content ?? []
    expect(json[0].type).toBe('image')
    /** 第二个应该是 "hi" 段落，不再是空段落 */
    expect(json[1].type).toBe('paragraph')
    expect(json[1].content?.[0]?.text).toBe('hi')
    cleanup()
  })

  it('appendAtCursor inserts at cursor', async () => {
    const { editor, cleanup } = makeEditor('<p>hello</p>')
    editor.commands.setTextSelection(6)
    await appendAtCursor(editor, ['a.png'])
    expect(countImages(editor)).toBe(1)
    cleanup()
  })

  it('notifies native on success', async () => {
    const { editor, cleanup } = makeEditor('')
    await insertAtTop(editor, ['a.png'])
    expect(spy).toHaveBeenCalledWith('headerImagesWithURLSet', expect.objectContaining({ imageCount: 1 }))
    cleanup()
  })
})
