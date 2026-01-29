import type { Editor } from '@tiptap/react'
import { useCallback, useEffect, useState } from 'react'
import { getEditorContent, setEditorContent } from '../../../operate'
import { useTiptapEditor } from '../use-tiptap-editor'
import { useStorageSave, type UseStorageSaveOptions } from './use-storage-save'

/**
 * 自动保存 Hooks：负责处理编辑器内容的加载与自动保存逻辑
 */
export function useAutoSave(options: UseStorageSaveOptions & { editor?: Editor }) {
  const { editor } = useTiptapEditor(options.editor)
  const {
    loadFromStorage,
    debouncedSave: _debouncedSave,
    immediateSave: _immediateSave,
  } = useStorageSave(options)

  const [content, setContent] = useState<string | object>('')

  // 1. 初始化加载逻辑
  useEffect(() => {
    if (!editor)
      return

    loadFromStorage().then((savedContent) => {
      const initialContent = savedContent || ''
      setContent(initialContent)
      setEditorContent(editor, initialContent, false)
    })
  }, [loadFromStorage, editor])

  // 2. 保存逻辑封装
  const debouncedSave = useCallback(
    (editor: Editor) => {
      const currentContent = getEditorContent(editor) || ''
      setContent(currentContent)
      _debouncedSave(editor)
    },
    [_debouncedSave],
  )

  const immediateSave = useCallback(
    (editor: Editor) => {
      const currentContent = getEditorContent(editor) || ''
      setContent(currentContent)
      _immediateSave(editor)
    },
    [_immediateSave],
  )

  return {
    content,
    contentType: typeof content === 'string'
      ? 'markdown'
      : 'json',
    debouncedSave,
    immediateSave,
  }
}
