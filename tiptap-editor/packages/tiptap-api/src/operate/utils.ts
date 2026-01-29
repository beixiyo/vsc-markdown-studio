import type { Editor } from '@tiptap/core'

/**
 * 检查编辑器实例是否有效以及特定命令是否存在
 * @param editor 编辑器实例
 * @param commandName 命令名称
 * @returns 是否有效
 */
export function isValidCommand(editor: Editor | null | undefined, commandName: string): boolean {
  if (!editor)
    return false

  const cmds = editor.commands as any
  return typeof cmds?.[commandName] === 'function'
}

/**
 * 统一处理编辑器内容更新逻辑，包含错误捕获
 * @param editor 编辑器实例
 * @param action 执行更新的回调函数
 * @param error message 错误消息前缀
 * @returns 是否成功 (或者 action 的返回值)
 */
export function tryExecute<T>(
  editor: Editor | null | undefined,
  action: (editor: Editor) => T,
  errorMessage: string = '执行命令失败',
): T | boolean {
  if (!editor)
    return false

  try {
    return action(editor)
  }
  catch (error) {
    console.error(`${errorMessage}:`, error)
    return false
  }
}
