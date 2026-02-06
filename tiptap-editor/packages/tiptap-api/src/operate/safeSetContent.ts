import type { Content, Editor, SetContentOptions } from '@tiptap/core'
import { getEditorElement } from 'tiptap-utils'

/**
 * 安全地设置编辑器内容，同时保持用户的光标位置和滚动位置
 *
 * @param editor - TipTap 编辑器实例
 * @param content - 要设置的内容（字符串或 JSON）
 * @param options - 配置选项
 *
 * @example
 * ```ts
 * safeSetContent(editor, markdownContent, {
 *   contentType: 'markdown',
 *   preserveCursor: true,
 *   preserveScroll: true,
 * })
 * ```
 */
export function safeSetContent(
  editor: Editor | null,
  content: Content,
  options: SafeSetContentOptions = {},
): boolean {
  if (!editor) {
    return false
  }

  const {
    preserveCursor = true,
    preserveScroll = true,
    ...setContentOptions
  } = options

  // 1. 保存当前光标位置
  const { from, to } = editor.state.selection

  // 2. 保存滚动位置（编辑器容器）
  const editorElement = getEditorElement(editor)?.parentElement ?? null
  const scrollTop = editorElement?.scrollTop ?? 0
  const scrollLeft = editorElement?.scrollLeft ?? 0

  // 3. 设置内容
  try {
    editor.commands.setContent(content, setContentOptions)
  }
  catch (error) {
    console.error('设置内容失败:', error)
    return false
  }

  // 4. 恢复光标位置
  if (preserveCursor) {
    restoreCursorPosition(editor, from, to)
  }

  // 5. 恢复滚动位置
  if (preserveScroll && editorElement) {
    restoreScrollPosition(editorElement, scrollTop, scrollLeft)
  }

  return true
}

/**
 * 恢复光标位置到指定位置
 * 如果位置超出文档范围，会自动调整到有效范围内
 */
function restoreCursorPosition(editor: Editor, from: number, to: number) {
  try {
    const docSize = editor.state.doc.content.size

    /** 确保位置在有效范围内（至少为 1，最多为 docSize - 1） */
    const safeFrom = Math.max(1, Math.min(from, docSize - 1))
    const safeTo = Math.max(1, Math.min(to, docSize - 1))

    /** 确保 from <= to */
    const finalFrom = Math.min(safeFrom, safeTo)
    const finalTo = Math.max(safeFrom, safeTo)

    editor.commands.setTextSelection({ from: finalFrom, to: finalTo })
  }
  catch {
    /**
     * 如果恢复失败，静默忽略
     * 可能是因为文档结构发生了重大变化
     */
  }
}

/**
 * 恢复滚动位置
 * 使用 requestAnimationFrame 确保在 DOM 更新后执行
 */
function restoreScrollPosition(
  element: HTMLElement,
  scrollTop: number,
  scrollLeft: number,
) {
  requestAnimationFrame(() => {
    element.scrollTop = scrollTop
    element.scrollLeft = scrollLeft
  })
}

export interface SafeSetContentOptions extends SetContentOptions {
  /** 是否保持光标位置，默认 true */
  preserveCursor?: boolean
  /** 是否保持滚动位置，默认 true */
  preserveScroll?: boolean
}
