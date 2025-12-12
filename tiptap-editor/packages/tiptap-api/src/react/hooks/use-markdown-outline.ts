import type { Editor } from '@tiptap/core'
import { useEffect, useState } from 'react'
import { buildOutline, type OutlineItem } from '../../data'

/**
 * 监听编辑器更新并生成 Markdown 大纲树
 */
export function useMarkdownOutline(editor: Editor | null): UseMarkdownOutlineResult {
  const [outline, setOutline] = useState<OutlineItem[]>([])

  useEffect(() => {
    if (!editor)
      return

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
    if (!editor)
      return
    setOutline(buildOutline(editor.state.doc))
  }

  return {
    outline,
    refreshOutline,
  }
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
