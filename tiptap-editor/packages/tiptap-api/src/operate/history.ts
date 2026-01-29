import type { Editor } from '@tiptap/core'
import { tryExecute } from './utils'

/**
 * 撤销
 */
export function undo(editor: Editor | null): boolean {
  return tryExecute(
    editor,
    e => e.chain().focus().undo().run(),
    '撤销失败',
  ) as boolean
}

/**
 * 重做
 */
export function redo(editor: Editor | null): boolean {
  return tryExecute(
    editor,
    e => e.chain().focus().redo().run(),
    '重做失败',
  ) as boolean
}
