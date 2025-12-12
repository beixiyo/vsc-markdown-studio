import type { Content, Editor } from '@tiptap/core'

/**
 * 获取编辑器内容，优先获取 Markdown 格式，如果无法获取则获取 JSON 格式
 */
export function getEditorContent(editor: Editor) {
  const md = getEditorMarkdown(editor)
  if (md) return md

  const json = getEditorJson(editor)
  if (json) return json
  return null
}

/**
 * 设置通用内容（JSON、HTML、Markdown 需由调用方提供对应格式）
 * @param editor Tiptap 编辑器实例
 * @param content 支持的内容格式
 * @param emitUpdate 是否触发更新事件
 */
export function setEditorContent(
  editor: Editor | null,
  content: Content,
  emitUpdate: boolean = true
): boolean {
  if (!editor) return false

  try {
    const cmds = editor?.commands
    if (!cmds?.setContent) return false

    cmds.setContent(content, { emitUpdate })
    return true
  } catch (error) {
    console.error('设置内容失败:', error)
    return false
  }
}

/**
 * 获取 HTML 格式内容
 */
export function getEditorHTML(editor: Editor | null): string | null {
  if (!editor) return null

  try {
    return editor?.getHTML?.() ?? null
  }
  catch (error) {
    console.error('获取 HTML 失败:', error)
    return null
  }
}

/**
 * 设置 HTML 格式内容
 */
export function setEditorHTML(
  editor: Editor | null,
  html: string,
  emitUpdate: boolean = true
): boolean {
  if (!editor) return false

  try {
    const cmds = editor?.commands
    if (!cmds?.setContent) return false

    cmds.setContent(html, { emitUpdate })
    return true
  }
  catch (error) {
    console.error('设置 HTML 失败:', error)
    return false
  }
}

/**
 * 获取 Markdown 格式内容
 */
export function getEditorMarkdown(editor: Editor | null): string | null {
  if (!editor) return null

  try {
    if (typeof editor.getMarkdown === "function") {
      return editor.getMarkdown()
    }

    return null
  }
  catch (error) {
    console.error("获取编辑器内容失败:", error)
    return null
  }
}

/**
 * 设置 Markdown 格式内容
 */
export function setEditorMarkdown(
  editor: Editor | null,
  markdown: string,
  emitUpdate: boolean = true
): boolean {
  if (!editor) return false

  try {
    editor?.commands.setContent(markdown, {
      contentType: typeof markdown === 'string' ? 'markdown' : 'json',
      emitUpdate
    })
    return true
  }
  catch (error) {
    return false
  }
}

export function getEditorJson(editor: Editor) {
  if (!editor) return null

  try {
    return editor.getJSON()
  }
  catch (error) {
    console.error("获取编辑器内容失败:", error)
    return null
  }
}
