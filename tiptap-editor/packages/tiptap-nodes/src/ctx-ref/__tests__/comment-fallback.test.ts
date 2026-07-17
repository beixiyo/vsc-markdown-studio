/**
 * HtmlCommentNode 兜底节点测试（与 CtxRefNode 配套的安全网，见 README）
 *
 * 断言：
 * 1. 非 ctx-ref 的行内 <!--...--> 被吞成不可见 htmlComment atom，往返幂等
 * 2. 触碰该段落的 transaction 不抛错（若落入通用 HTML 解析会是非法 doc → 崩）
 * 3. 合法 ctx-ref marker 让位给 CtxRefNode（不被兜底节点抢走）
 */
import { Editor } from '@tiptap/core'
import { Markdown } from '@tiptap/markdown'
import { StarterKit } from '@tiptap/starter-kit'
import { describe, expect, it } from 'vitest'
import { HtmlCommentNode } from '../comment-fallback'
import { CtxRefNode } from '../extension'

function createEditor() {
  const el = document.createElement('div')
  document.body.appendChild(el)

  return new Editor({
    element: el,
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Markdown.configure({ markedOptions: { gfm: true, breaks: true } }),
      CtxRefNode.configure(),
      HtmlCommentNode.configure(),
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

describe('comment-fallback', () => {
  it('非 ctx-ref 行内注释被吞成 htmlComment atom 且往返幂等', () => {
    const editor = createEditor()
    setMarkdown(editor, '前<!--todo: revisit-->后')

    let comment: any = null
    editor.state.doc.descendants((node) => {
      if (node.type.name === 'htmlComment') {
        comment = node
        expect(node.isAtom).toBe(true)
      }
      return true
    })
    expect(comment).not.toBeNull()
    expect(comment.attrs.raw).toBe('<!--todo: revisit-->')

    /** 非法 doc 会在触碰段落时崩，这里应当安然无恙 */
    expect(() => editor.commands.selectAll()).not.toThrow()
    expect(serialize(editor)).toContain('<!--todo: revisit-->')
    editor.destroy()
  })

  it('renderText 为空，注释不进纯文本', () => {
    const editor = createEditor()
    setMarkdown(editor, 'a<!--x-->b')
    expect(editor.getText()).toBe('ab')
    editor.destroy()
  })

  it('合法 ctx-ref marker 让位给 CtxRefNode', () => {
    const editor = createEditor()
    setMarkdown(editor, 'x<!--ctx-ref:mark:1-->y')

    const names: string[] = []
    editor.state.doc.descendants((node) => {
      if (node.type.name === 'ctxRef' || node.type.name === 'htmlComment')
        names.push(node.type.name)
      return true
    })
    expect(names).toEqual(['ctxRef'])
    editor.destroy()
  })

  /**
   * 直接以 JSON doc 加载「未知类型 ctxRef + htmlComment」两个真实节点
   * （playground content.json 走的正是这条 JSON 路径，非 markdown 解析），
   * 断言 schema 合法、不抛错、序列化原样还原
   */
  it('JSON doc 直接加载未知 ctxRef + htmlComment 不崩且往返', () => {
    const editor = createEditor()
    editor.commands.setContent({
      type: 'doc',
      content: [{
        type: 'paragraph',
        content: [
          { type: 'text', text: 'a' },
          { type: 'ctxRef', attrs: { refType: 'speaker', refId: '9' } },
          { type: 'text', text: 'b' },
          { type: 'htmlComment', attrs: { raw: '<!--todo: revisit-->' } },
          { type: 'text', text: 'c' },
        ],
      }],
    })

    expect(() => editor.commands.selectAll()).not.toThrow()

    const md = serialize(editor)
    expect(md).toContain('<!--ctx-ref:speaker:9-->')
    expect(md).toContain('<!--todo: revisit-->')
    editor.destroy()
  })
})
