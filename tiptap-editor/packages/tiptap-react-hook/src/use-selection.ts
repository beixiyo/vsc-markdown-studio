import type { Editor } from '@tiptap/react'
import { useCallback, useEffect, useState } from 'react'
import { getSelectedText, hasSelectedText } from 'tiptap-api'
import { useTiptapEditor } from './use-tiptap-editor'

export interface UseSelectionConfig {
  /**
   * 可选的编辑器实例，如果不提供则从上下文获取
   */
  editor?: Editor | null
  /**
   * 是否在选中文本变化时自动更新状态
   * @default true
   */
  autoUpdate?: boolean
}

export interface UseSelectionReturn {
  /**
   * 当前选中的文本
   */
  selectedText: string
  /**
   * 是否有选中文本
   */
  hasSelection: boolean
  /**
   * 手动获取选中文本
   */
  getSelection: () => string
}

/**
 * Hook 用于获取和管理编辑器选中文本
 */
export function useSelection(
  config: UseSelectionConfig = {},
): UseSelectionReturn {
  const { editor: providedEditor, autoUpdate = true } = config
  const { editor } = useTiptapEditor(providedEditor)

  const [selectedText, setSelectedText] = useState<string>('')
  const [hasSelection, setHasSelection] = useState<boolean>(false)

  const getSelection = useCallback(() => {
    if (!editor) {
      return ''
    }

    const text = getSelectedText(editor)
    const has = hasSelectedText(editor)

    setSelectedText(text)
    setHasSelection(has)

    return text
  }, [editor])

  useEffect(() => {
    if (!editor || !autoUpdate) {
      return
    }

    const handleSelectionUpdate = () => {
      getSelection()
    }

    editor.on('selectionUpdate', handleSelectionUpdate)

    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate)
    }
  }, [editor, autoUpdate, getSelection])

  return {
    selectedText,
    hasSelection,
    getSelection,
  }
}
