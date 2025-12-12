import type { Editor } from '@tiptap/core'

/**
 * 获取光标位置（返回选区起点）
 */
export function getTextCursorPosition(editor: Editor | null): number | null {
  if (!editor || !editor.state.selection) return null
  return editor.state.selection.from
}

/**
 * 设置光标位置
 * @param pos 文档位置
 */
export function setTextCursorPosition(editor: Editor | null, pos: number): boolean {
  if (!editor) return false
  if (pos < 0) return false

  try {
    return editor.chain().focus().setTextSelection(pos).run()
  } catch (error) {
    console.error('设置光标失败:', error)
    return false
  }
}


