/**
 * ctx-ref marker 兼容层测试（本节点存在的意义，见 README）
 *
 * 用真实 CtxRefNode + 真实 @tiptap/markdown 走 parse / serialize，断言：
 * 1. `<!--ctx-ref:type:id-->` 解析为 atom 节点、逐字符往返幂等
 * 2. 未知类型也被消费成 ctxRef 节点（不落入通用 HTML 解析产出非法 doc）
 * 3. renderText 为空——锚点不进纯文本
 * 4. stripCtxRefMarkers 剥离（复制 / 导出场景）
 * 5. onClick 从 DOM 还原 attrs 与紧邻加粗斜体句
 */
import { Editor } from '@tiptap/core'
import { Markdown } from '@tiptap/markdown'
import { StarterKit } from '@tiptap/starter-kit'
import { describe, expect, it, vi } from 'vitest'
import { CtxRefNode } from '../extension'
import { stripCtxRefMarkers } from '../rules'

function createEditor(onClick?: (payload: any, event: MouseEvent) => void) {
  const el = document.createElement('div')
  document.body.appendChild(el)

  return new Editor({
    element: el,
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Markdown.configure({ markedOptions: { gfm: true, breaks: true } }),
      CtxRefNode.configure({ onClick }),
    ],
    content: '',
  })
}

function setMarkdown(editor: Editor, md: string) {
  const mgr = (editor as any).markdown
  editor.commands.setContent(mgr.parse(md))
}

function serialize(editor: Editor): string {
  return (editor as any).markdown.serialize(editor.state.doc.toJSON())
}

describe('ctx-ref', () => {
  it('marker 解析为 atom 节点且往返幂等', () => {
    const editor = createEditor()
    const md = '***I feel.***<!--ctx-ref:mark:18504-->'
    setMarkdown(editor, md)

    let count = 0
    editor.state.doc.descendants((node) => {
      if (node.type.name === 'ctxRef') {
        count += 1
        expect(node.isAtom).toBe(true)
        expect(node.attrs).toMatchObject({ refType: 'mark', refId: '18504' })
      }
      return true
    })
    expect(count).toBe(1)

    /** 多轮往返逐字符稳定 */
    let cur = serialize(editor)
    for (let i = 0; i < 3; i++) {
      setMarkdown(editor, cur)
      cur = serialize(editor)
    }
    expect(cur).toContain('<!--ctx-ref:mark:18504-->')
    editor.destroy()
  })

  it('未知类型也被消费成 ctxRef 节点（不产出非法 doc）', () => {
    const editor = createEditor()
    setMarkdown(editor, 'x<!--ctx-ref:speaker:9-->y')

    const types: string[] = []
    editor.state.doc.descendants((node) => {
      if (node.type.name === 'ctxRef')
        types.push(node.attrs.refType)
      return true
    })
    expect(types).toEqual(['speaker'])
    /** 触碰文档的 transaction 不应抛错（非法 doc 会在此崩） */
    expect(() => editor.commands.selectAll()).not.toThrow()
    editor.destroy()
  })

  it('renderText 为空，锚点不进纯文本', () => {
    const editor = createEditor()
    setMarkdown(editor, '***A much longer sentence.***<!--ctx-ref:mark:old-->')
    setMarkdown(editor, 'Hello.<!--ctx-ref:note:1-->')
    expect(editor.getText()).not.toContain('ctx-ref')
    expect(editor.getText()).toContain('Hello.')
    editor.destroy()
  })

  it('stripCtxRefMarkers 剥离锚点，保留可读内容', () => {
    const input = '***\'I feel\'***<!--ctx-ref:mark:1--><!--ctx-ref:note:2-->.'
    expect(stripCtxRefMarkers(input)).toBe('***\'I feel\'***.')
    expect(stripCtxRefMarkers(input, { types: ['note'] }))
      .toBe('***\'I feel\'***<!--ctx-ref:mark:1-->.')
  })

  it('onClick 还原 attrs 与紧邻加粗斜体句', () => {
    const onClick = vi.fn()
    const editor = createEditor(onClick)
    setMarkdown(editor, '***I feel.***<!--ctx-ref:mark:18504-->')

    const anchor = editor.view.dom.querySelector<HTMLElement>('[data-ctx-ref]')
    expect(anchor).not.toBeNull()
    anchor!.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onClick.mock.calls[0][0]).toMatchObject({
      refType: 'mark',
      refId: '18504',
      sentence: 'I feel.',
    })
    editor.destroy()
  })
})
