import type { Editor } from '@tiptap/react'
import { useCallback, useEffect, useState } from 'react'
import { getEditorContent } from '../../../operate'
import { useTiptapEditor } from '../use-tiptap-editor'
import { useStorageSave, type UseStorageSaveOptions } from './use-storage-save'

export function useAutoSave(options: UseStorageSaveOptions & { editor?: Editor }) {
  const { editor } = useTiptapEditor(options.editor)
  const {
    loadFromStorage,
    debouncedSave: _debouncedSave,
    immediateSave: _immediateSave,
  } = useStorageSave(options)

  const [markdown, setMarkdown] = useState<string | object>('')
  const contentType = typeof markdown === 'string'
    ? 'markdown'
    : 'json'

  useEffect(() => {
    if (!editor)
      return

    loadFromStorage().then((markdown) => {
      const str = markdown || ''
      setMarkdown(str)
      editor?.commands.setContent(str, { contentType: typeof str === 'string'
        ? 'markdown'
        : 'json' })
    })
  }, [loadFromStorage, editor])

  const debouncedSave = useCallback(
    (editor: Editor) => {
      const content = getEditorContent(editor) || ''
      setMarkdown(content)
      _debouncedSave(editor)
    },
    [_debouncedSave],
  )

  const immediateSave = useCallback(
    (editor: Editor) => {
      const content = getEditorContent(editor) || ''
      setMarkdown(content)
      _immediateSave(editor)
    },
    [_immediateSave],
  )

  return {
    markdown,
    contentType,
    debouncedSave,
    immediateSave,
  }
}
