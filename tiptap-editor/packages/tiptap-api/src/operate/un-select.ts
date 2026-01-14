import type { Editor } from '@tiptap/core'

/**
 * 取消选择
 * @param editor Tiptap 编辑器实例
 */
export function unSelect(editor: Editor | null) {
  if (!editor)
    return

  const docSize = editor.state.doc.content.size
  editor.commands.setTextSelection(docSize)
  editor.view.dom.blur()
}
