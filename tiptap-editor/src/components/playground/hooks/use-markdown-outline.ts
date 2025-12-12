import { useEffect, useState } from 'react'
import type { Editor } from '@tiptap/core'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

/**
 * Markdown 大纲节点
 */
export type OutlineItem = {
  /**
   * 唯一标识，使用文档位置保证可追踪
   */
  id: string
  /**
   * 标题等级，1-6
   * @default 1
   */
  level: number
  /**
   * 标题纯文本
   */
  text: string
  /**
   * 在文档中的位置，可用于滚动或高亮
   */
  position: number
  /**
   * 子标题
   * @default []
   */
  children: OutlineItem[]
}

/**
 * 将 ProseMirror 文档中的标题节点转换为大纲树
 */
const buildOutline = (doc: ProseMirrorNode): OutlineItem[] => {
  const headings: OutlineItem[] = []

  doc.descendants((node, pos) => {
    if (node.type.name !== 'heading') return
    const text = node.textContent.trim()
    if (!text) return

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
    } else {
      stack[stack.length - 1].children.push(heading)
    }

    stack.push(heading)
  })

  return roots
}

export type UseMarkdownOutlineResult = {
  /**
   * 当前大纲数据
   */
  outline: OutlineItem[]
  /**
   * 手动刷新大纲
   */
  refreshOutline: () => void
}

/**
 * 监听编辑器更新并生成 Markdown 大纲树
 */
export const useMarkdownOutline = (editor: Editor | null): UseMarkdownOutlineResult => {
  const [outline, setOutline] = useState<OutlineItem[]>([])

  useEffect(() => {
    if (!editor) return

    const refreshOutline = () => {
      setOutline(buildOutline(editor.state.doc))
    }

    refreshOutline()
    editor.on('update', refreshOutline)

    return () => {
      editor.off('update', refreshOutline)
    }
  }, [editor])

  const refreshOutline = () => {
    if (!editor) return
    setOutline(buildOutline(editor.state.doc))
  }

  return {
    outline,
    refreshOutline,
  }
}

