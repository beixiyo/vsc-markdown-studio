import type { Editor } from '@tiptap/react'
import { NodeSelection } from '@tiptap/pm/state'
import { getContentAtPos } from './hover/content'

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
   * 我们也不希望显示工具栏。但如果是正常的文本字符，我们应该允许。
   */
  const { $from, $to } = selection
  if ($from.pos === $to.pos - 1) {
    const node = $from.nodeAfter
    if (node && node.isAtom && !node.isText) {
      return false
    }
  }

  /**
   * 检查选区是否在 codeBlock 内部。
   * 如果选区起点所在的节点是 codeBlock，或者属于 codeBlock 的后代，则不显示 SelectionToolbar。
   */
  let isInsideCodeBlock = false
  editor.state.doc.nodesBetween(selection.from, selection.to, (node) => {
    if (node.type.name === 'codeBlock') {
      isInsideCodeBlock = true
      return false
    }
  })

  if (isInsideCodeBlock) {
    return false
  }

  return true
}

/**
 * 判断选区是否全部为链接文本
 */
export function isSelectionOnlyLinkText(editor: Editor | null): boolean {
  if (!editor || !editor.state.selection) {
    return false
  }

  const { selection } = editor.state
  if (selection.empty) {
    return false
  }

  if (selection instanceof NodeSelection) {
    return false
  }

  const { from, to } = selection
  let hasTextNode = false
  let hasNonLinkText = false

  editor.state.doc.nodesBetween(from, to, (node) => {
    if (!node.isText) {
      return
    }
    hasTextNode = true
    const hasLink = node.marks.some(mark => mark.type.name === 'link')
    if (!hasLink) {
      hasNonLinkText = true
    }
  })

  return hasTextNode && !hasNonLinkText
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
  if (!editor || !editor.state.selection) {
    return null
  }

  try {
    if (!editor.view) {
      return null
    }
  }
  catch (e) {
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

/**
 * 获取选区所在的「段落区间」——基于 {@link getContentAtPos}，额外附带选中文本
 *
 * - 有选中文本：返回选中文本 + 所属 section 上下文
 * - 无选中文本（光标）：返回光标所在 section 的全部内容
 */
export function getSelectionSection(editor: Editor | null): SelectionSection | null {
  if (!editor)
    return null

  const content = getContentAtPos(editor, editor.state.selection.from, { includeSection: true })
  if (!content || content.sectionRange == null)
    return null

  const { selection } = editor.state
  const selectedText = selection.empty
    ? ''
    : editor.state.doc.textBetween(selection.from, selection.to, '\n')

  return {
    selectedText,
    sectionText: content.sectionText ?? '',
    sectionMarkdown: content.sectionMarkdown ?? '',
    sectionRange: content.sectionRange,
    heading: content.sectionHeading ?? null,
  }
}

export type SelectionSection = {
  /** 用户选中的文本，光标无选区时为空字符串 */
  selectedText: string
  /** 整个 section 的纯文本（从标题到下一个同级标题之前） */
  sectionText: string
  /** 整个 section 的 Markdown 格式文本，保留标题/加粗/链接等格式；markdown 扩展不可用时为空字符串 */
  sectionMarkdown: string
  /** section 在文档中的位置范围 */
  sectionRange: { from: number, to: number }
  /** 所属标题信息，文档开头无标题时为 null */
  heading: {
    level: number
    text: string
    position: number
  } | null
}
