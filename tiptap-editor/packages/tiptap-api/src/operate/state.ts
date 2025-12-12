import type { Editor } from '@tiptap/core'

/**
 * 聚焦编辑器
 */
export function focusEditor(editor: Editor | null): boolean {
  if (!editor)
    return false
  try {
    return editor.chain().focus().run()
  }
  catch (error) {
    console.error('聚焦失败:', error)
    return false
  }
}

/**
 * 是否可编辑
 */
export function isEditable(editor: Editor | null): boolean {
  if (!editor)
    return false
  try {
    return editor.isEditable
  }
  catch (error) {
    console.error('读取可编辑状态失败:', error)
    return false
  }
}

/**
 * 设置可编辑状态
 */
export function setEditableState(editor: Editor | null, editable: boolean): boolean {
  if (!editor)
    return false

  try {
    editor.setEditable(editable)
    return true
  }
  catch (error) {
    console.error('设置可编辑状态失败:', error)
    return false
  }
}

/**
 * 判断文档是否为空
 */
export function isEmptyDoc(editor: Editor | null): boolean {
  if (!editor)
    return true

  try {
    return editor.isEmpty
  }
  catch (error) {
    console.error('读取空文档状态失败:', error)
    return true
  }
}
