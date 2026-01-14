import type { Editor } from '@tiptap/react'
import { NodeSelection } from '@tiptap/pm/state'

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

  const { selection } = editor.state

  /** 如果没有选中内容（光标位置），返回 false */
  if (selection.empty) {
    return false
  }

  /**
   * 如果是 NodeSelection (例如选中了 Mermaid、图片、分割线等原子节点)，
   * 对于大部分这类节点，SelectionToolbar 并没有意义，因此返回 false
   */
  if (selection instanceof NodeSelection) {
    return false
  }

  /**
   * 即使是 TextSelection，如果它仅仅包含一个原子节点（例如插入后被自动选中的情况），
   * 我们也不希望显示工具栏。
   */
  const { $from, $to } = selection
  if ($from.pos === $to.pos - 1) {
    const node = $from.nodeAfter
    if (node && node.isAtom) {
      return false
    }
  }

  return true
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
