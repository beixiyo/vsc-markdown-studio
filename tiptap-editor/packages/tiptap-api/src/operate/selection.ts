import type { Editor } from '@tiptap/react'

/**
 * 获取当前选中文本
 * @param editor Tiptap 编辑器实例
 * @returns 选中的文本内容，如果没有选中则返回空字符串
 */
export function getSelectedText(editor: Editor | null): string {
  if (!editor || !editor.state.selection) {
    return ''
  }

  const { from, to } = editor.state.selection

  /** 如果没有选中内容（光标位置），返回空字符串 */
  if (from === to) {
    return ''
  }

  /** 使用 textBetween 提取文本，'\n' 是块级元素之间的分隔符 */
  return editor.state.doc.textBetween(from, to, '\n')
}

/**
 * 检查是否有选中文本
 * @param editor Tiptap 编辑器实例
 * @returns 是否有选中文本
 */
export function hasSelectedText(editor: Editor | null): boolean {
  if (!editor || !editor.state.selection) {
    return false
  }

  const { from, to } = editor.state.selection
  return from !== to
}

/**
 * 获取当前选区范围
 */
export function getSelectionRange(
  editor: Editor | null,
): { from: number, to: number } | null {
  if (!editor || !editor.state.selection)
    return null

  const { from, to } = editor.state.selection
  return { from, to }
}

/**
 * 设置选区范围
 * @param editor Tiptap 编辑器实例
 * @param from 起始位置
 * @param to 结束位置
 */
export function setSelectionRange(
  editor: Editor | null,
  from: number,
  to: number,
): boolean {
  if (!editor)
    return false
  if (from < 0 || to < 0)
    return false

  try {
    return editor.chain().focus().setTextSelection({ from, to }).run()
  }
  catch (error) {
    console.error('设置选区失败:', error)
    return false
  }
}

/**
 * 获取选区或指定范围的 DOMRect，用于定位浮层
 * @param editor 编辑器实例
 * @param from 起始位置（可选，默认使用当前选区起点）
 * @param to 结束位置（可选，默认使用当前选区终点）
 */
export function getSelectionRect(
  editor: Editor | null,
  from?: number,
  to?: number,
): DOMRect | null {
  if (!editor || !editor.view || !editor.state.selection) {
    return null
  }

  const selectionFrom = typeof from === 'number'
    ? from
    : editor.state.selection.from
  const selectionTo = typeof to === 'number'
    ? to
    : editor.state.selection.to

  try {
    const fromCoords = editor.view.coordsAtPos(selectionFrom)
    const toCoords = editor.view.coordsAtPos(selectionTo)

    const left = Math.min(fromCoords.left, toCoords.left)
    const right = Math.max(fromCoords.right ?? fromCoords.left, toCoords.right ?? toCoords.left)
    const top = Math.min(fromCoords.top, toCoords.top)
    const bottom = Math.max(fromCoords.bottom ?? fromCoords.top, toCoords.bottom ?? toCoords.top)

    return new DOMRect(
      left,
      top,
      Math.max(0, right - left),
      Math.max(0, bottom - top),
    )
  }
  catch (error) {
    console.error('获取选区位置失败:', error)
    return null
  }
}
