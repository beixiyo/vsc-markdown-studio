import { describe, expect, it, vi } from 'vitest'
import { generateImageId, ImageNode } from '../extension'
import { imageNodes, makeEditor } from './helpers'

describe('generateImageId', () => {
  it('returns img_-prefixed id', () => {
    const id = generateImageId()
    expect(id.startsWith('img_')).toBe(true)
    expect(id.length).toBeGreaterThan(4)
  })

  it('produces unique ids across calls', () => {
    const set = new Set(Array.from({ length: 200 }, () => generateImageId()))
    expect(set.size).toBe(200)
  })
})

describe('imageNode schema', () => {
  it('is inline atom', () => {
    expect(ImageNode.config.inline).toBe(true)
    expect(ImageNode.config.atom).toBe(true)
    expect(ImageNode.config.group).toBe('inline')
  })

  it('default loading=lazy / decoding=async / display=inline-block', () => {
    const { editor, cleanup } = makeEditor()
    editor.commands.setContent({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'image', attrs: { src: 'x.png' } }] }],
    })
    const { attrs } = imageNodes(editor)[0]
    expect(attrs.loading).toBe('lazy')
    expect(attrs.decoding).toBe('async')
    expect(attrs.display).toBe('inline-block')
    cleanup()
  })
})

describe('commands', () => {
  it('setImage inserts an image', () => {
    const { editor, cleanup } = makeEditor('<p>hello</p>')
    editor.commands.setTextSelection(6)
    editor.commands.setImage({ src: 'a.png' })
    const nodes = imageNodes(editor)
    expect(nodes).toHaveLength(1)
    expect(nodes[0].attrs.src).toBe('a.png')
    cleanup()
  })

  it('updateImage patches attrs of selected image', () => {
    const { editor, cleanup } = makeEditor('<p></p>')
    editor.commands.setImage({ src: 'a.png' })
    /** 选中刚插入的 image（atom 节点，选中它本身） */
    editor.commands.setNodeSelection(1)
    editor.commands.updateImage({ width: 320, borderRadius: '12px' })
    const { attrs } = imageNodes(editor)[0]
    expect(attrs.width).toBe(320)
    expect(attrs.borderRadius).toBe('12px')
    expect(attrs.src).toBe('a.png')
    cleanup()
  })
})

describe('auto-id plugin', () => {
  it('fills id when setImage is called without id', () => {
    const { editor, cleanup } = makeEditor('<p></p>')
    editor.commands.setImage({ src: 'a.png' })
    const { attrs } = imageNodes(editor)[0]
    expect(typeof attrs.id).toBe('string')
    expect((attrs.id as string).startsWith('img_')).toBe(true)
    cleanup()
  })

  it('preserves caller-supplied id', () => {
    const { editor, cleanup } = makeEditor('<p></p>')
    editor.commands.setImage({ src: 'a.png', id: 'stable-1' })
    expect(imageNodes(editor)[0].attrs.id).toBe('stable-1')
    cleanup()
  })

  it('fills id after setContent with image missing id', () => {
    const { editor, cleanup } = makeEditor()
    editor.commands.setContent({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'image', attrs: { src: 'a.png' } }] }],
    })
    const { attrs } = imageNodes(editor)[0]
    expect(typeof attrs.id).toBe('string')
    expect((attrs.id as string).length).toBeGreaterThan(0)
    cleanup()
  })

  it('parseHTML round-trip: id is regenerated (not serialized)', () => {
    const { editor, cleanup } = makeEditor('<p></p>')
    /** 用 setContent 触发 docChanged，让 appendTransaction 补齐 id */
    editor.commands.setContent('<p><img src="a.png" data-display="block" data-border-radius="8px" /></p>')
    const { attrs } = imageNodes(editor)[0]
    expect(attrs.src).toBe('a.png')
    expect(attrs.display).toBe('block')
    expect(attrs.borderRadius).toBe('8px')
    expect(typeof attrs.id).toBe('string')
    /** 来自 parseHTML 的 id 是自动补的，不来自 HTML 本身 */
    expect((attrs.id as string).startsWith('img_')).toBe(true)
    cleanup()
  })
})

describe('renderHTML', () => {
  it('serializes data-* attrs and src, does not emit id', () => {
    const { editor, cleanup } = makeEditor('<p></p>')
    editor.commands.setImage({
      src: 'a.png',
      display: 'block',
      borderRadius: '8px',
      width: 200,
      opacity: 0.5,
      align: 'center',
    })
    const html = editor.getHTML()
    expect(html).toContain('src="a.png"')
    expect(html).toContain('data-display="block"')
    expect(html).toContain('data-border-radius="8px"')
    expect(html).toContain('data-width="200"')
    expect(html).toContain('data-opacity="0.5"')
    expect(html).toContain('data-align="center"')
    /** id 仅活在 ProseMirror 状态 */
    expect(html).not.toMatch(/\bid="img_/)
    expect(html).not.toMatch(/data-id=/)
    cleanup()
  })
})

describe('node view options', () => {
  it('onClick fires with attrs.id when image is clicked', () => {
    const onClick = vi.fn()
    const { editor, cleanup } = makeEditor('<p></p>', { onClick })
    editor.commands.setImage({ src: 'a.png', id: 'click-me' })
    const img = document.querySelector('img[data-image-node]') as HTMLImageElement
    expect(img).toBeTruthy()
    img.click()
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onClick.mock.calls[0][0].attrs.id).toBe('click-me')
    cleanup()
  })

  it('nodeView writes data-display attr on the <img>', () => {
    const { editor, cleanup } = makeEditor('<p></p>')
    editor.commands.setImage({ src: 'a.png', display: 'block' })
    const img = document.querySelector('img[data-image-node]') as HTMLImageElement
    expect(img.getAttribute('data-display')).toBe('block')
    cleanup()
  })
})
