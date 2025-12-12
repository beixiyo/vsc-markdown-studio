import type { Editor } from '@tiptap/core'

/**
 * 插入纯文本
 * @param editor Tiptap 编辑器实例
 * @param text 要插入的文本
 */
export function insertText(editor: Editor | null, text: string): boolean {
  if (!editor) return false
  if (!text) return true

  try {
    return editor.chain().focus().insertContent(text).run()
  } catch (error) {
    console.error('插入文本失败:', error)
    return false
  }
}

