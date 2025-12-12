import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { OutlineItem } from './types'

/**
 * 将 ProseMirror 文档中的标题节点转换为大纲树
 */
export function buildOutline(doc: ProseMirrorNode): OutlineItem[] {
  const headings: OutlineItem[] = []

  doc.descendants((node, pos) => {
    if (node.type.name !== 'heading')
      return
    const text = node.textContent.trim()
    if (!text)
      return

    headings.push({
      id: String(pos),
      level: node.attrs.level ?? 1,
      text,
      position: pos,
      children: [],
    })
  })

  const roots: OutlineItem[] = []
  const stack: OutlineItem[] = []

  headings.forEach((heading) => {
    while (stack.length > 0 && heading.level <= stack[stack.length - 1].level) {
      stack.pop()
    }

    if (stack.length === 0) {
      roots.push(heading)
    }
    else {
      stack[stack.length - 1].children.push(heading)
    }

    stack.push(heading)
  })

  return roots
}
