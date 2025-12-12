import type { Editor } from '@tiptap/core'

/**
 * 撤销
 */
export function undo(editor: Editor | null): boolean {
  if (!editor) return false

  try {
    const chain = editor?.chain?.()
    if (!chain) return false
    chain.focus()
    return chain.undo?.().run?.() ?? false
  }
  catch (error) {
    console.error('撤销失败:', error)
    return false
  }
}

/**
 * 重做
 */
export function redo(editor: Editor | null): boolean {
  if (!editor) return false

  try {
    const chain = editor?.chain?.()
    if (!chain) return false
    chain.focus()
    return chain.redo?.().run?.() ?? false
  }
  catch (error) {
    console.error('重做失败:', error)
    return false
  }
}


