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

/**
 * 规范化 markdown 内容，用于对比时忽略无关差异
 *
 * @param md - 原始 markdown 字符串
 * @returns 规范化后的字符串
 */
export function normalizeMarkdown(md: string): string {
  return md
    .replace(/\r\n/g, '\n') // 统一换行符
    .replace(/\n{3,}/g, '\n\n') // 多个空行合并为两个
    .replace(/[ \t]+$/gm, '') // 移除行尾空白
    .trim()
}

/**
 * 检查两个 markdown 内容是否实质相同（忽略空白差异）
 */
export function isMarkdownEqual(a: string, b: string): boolean {
  return normalizeMarkdown(a) === normalizeMarkdown(b)
}
