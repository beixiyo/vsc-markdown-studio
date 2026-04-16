import type { ImageOptions } from '../types'
import { Editor, Node } from '@tiptap/core'
import { ImageNode } from '../extension'

/** 最小 Document 节点 —— 仅允许 block 子节点 */
const Document = Node.create({
  name: 'doc',
  topNode: true,
  content: 'block+',
})

/** 最小 Paragraph 节点 —— 承载 inline */
const Paragraph = Node.create({
  name: 'paragraph',
  group: 'block',
  content: 'inline*',
  parseHTML: () => [{ tag: 'p' }],
  renderHTML: () => ['p', 0],
})

/** 最小 Text 节点 */
const Text = Node.create({
  name: 'text',
  group: 'inline',
})

/** jsdom 中可运行的最小编辑器，仅挂载 image 相关 schema */
export function makeEditor(content: any = '', options?: Partial<ImageOptions>) {
  const el = document.createElement('div')
  document.body.appendChild(el)
  const editor = new Editor({
    element: el,
    content,
    extensions: [
      Document,
      Paragraph,
      Text,
      ImageNode.configure(options ?? {}),
    ],
  })
  return {
    editor,
    el,
    cleanup: () => {
      editor.destroy()
      el.remove()
    },
  }
}

/** 深扫 doc，收集所有 image 节点（JSON 形态） */
export function imageNodes(editor: Editor) {
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
