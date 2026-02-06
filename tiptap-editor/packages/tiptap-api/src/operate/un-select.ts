import type { Editor } from '@tiptap/core'
import { getEditorElement } from 'tiptap-utils'

/**
 * 取消选择
 * @param editor Tiptap 编辑器实例
 */
export function unSelect(editor: Editor | null) {
  if (!editor)
    return

  const docSize = editor.state.doc.content.size
  editor.commands.setTextSelection(docSize)
  getEditorElement(editor)?.blur()
}
