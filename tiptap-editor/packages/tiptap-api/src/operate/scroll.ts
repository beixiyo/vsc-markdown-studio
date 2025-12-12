import type { Node as PMNode } from '@tiptap/pm/model'
import type { Editor } from '@tiptap/react'
import { TextSelection } from '@tiptap/pm/state'

export interface ScrollToRangeOptions {
  /**
   * 是否使用平滑滚动
   * @default true
   */
  behavior?: ScrollBehavior
  /**
   * 滚动后元素在视口中的位置
   * @default 'center'
   */
  block?: ScrollLogicalPosition
  /**
   * 是否设置选区到目标位置
   * @default true
   */
  setSelection?: boolean
}

/**
 * 滚动到文档中的指定位置
 * @param editor Tiptap 编辑器实例
 * @param pos 文档位置（从文档开始计算的字符位置）
 * @param options 滚动选项
 * @returns 是否成功滚动
 */
export function scrollToRange(
  editor: Editor | null,
  pos: number,
  options: ScrollToRangeOptions = {},
): boolean {
  if (!editor || !editor.state || !editor.view) {
    return false
  }

  const {
    behavior = 'smooth',
    block = 'center',
    setSelection = true,
  } = options

  try {
    const { state, view } = editor
    const { doc } = state

    pos = Math.max(1, Math.min(pos, doc.content.size))

    /** 方法1：使用 ProseMirror 的 scrollIntoView */
    if (setSelection) {
      const $pos = doc.resolve(pos)
      const selection = TextSelection.near($pos)
      const tr = state.tr.setSelection(selection).scrollIntoView()
      view.dispatch(tr)
    }

    /** 方法2：直接操作 DOM（当不需要设置选区时） */
    const domAtPos = view.domAtPos(pos)
    if (domAtPos && domAtPos.node) {
      const domNode = domAtPos.node.nodeType === Node.TEXT_NODE
        ? domAtPos.node.parentElement
        : (domAtPos.node as Element)

      if (domNode && domNode.scrollIntoView) {
        domNode.scrollIntoView({
          behavior,
          block,
          inline: 'nearest',
        })
        return true
      }
    }

    return false
  }
  catch (error) {
    console.error('Error scrolling to range:', error)
    return false
  }
}

/**
 * 滚动到指定范围的开始位置
 * @param editor Tiptap 编辑器实例
 * @param from 范围的开始位置
 * @param to 范围的结束位置
 * @param options 滚动选项
 * @returns 是否成功滚动
 */
export function scrollToRangeSelection(
  editor: Editor | null,
  from: number,
  to: number,
  options: ScrollToRangeOptions = {},
): boolean {
  if (!editor || !editor.state || !editor.view) {
    return false
  }

  const {
    behavior = 'smooth',
    block = 'center',
    setSelection = true,
  } = options

  try {
    const { state, view } = editor
    const { doc } = state

    /** 验证位置是否有效 */
    if (from < 0 || to < 0 || from > doc.content.size || to > doc.content.size) {
      console.warn(`Invalid range: [${from}, ${to}]. Document size: ${doc.content.size}`)
      return false
    }

    if (setSelection) {
      const selection = TextSelection.create(doc, from, to)
      const tr = state.tr.setSelection(selection).scrollIntoView()
      view.dispatch(tr)
    }

    /** 如果不设置选区，滚动到范围的开始位置 */
    return scrollToRange(editor, from, { behavior, block, setSelection: false })
  }
  catch (error) {
    console.error('Error scrolling to range selection:', error)
    return false
  }
}

/**
 * 滚动到指定 mark 的位置
 * 注意：此功能需要 mark 具有唯一标识符（如 commentId）
 * @param editor Tiptap 编辑器实例
 * @param markId mark 的唯一标识符
 * @param markType mark 的类型名称（如 'comment', 'highlight'）
 * @param options 滚动选项
 * @returns 是否成功找到并滚动到 mark
 */
export function scrollToMark(
  editor: Editor | null,
  markId: string,
  markType: 'comment' | (string & {}) = 'comment',
  options: ScrollToRangeOptions = {},
): boolean {
  if (!editor || !editor.state || !editor.view) {
    return false
  }

  try {
    const { state } = editor
    const { doc } = state
    let foundPos: number | null = null

    /** 遍历文档查找具有指定 markId 的 mark */
    doc.descendants((node: PMNode, pos: number) => {
      if (foundPos !== null) {
        return false // 已找到，停止遍历
      }

      /** 检查节点的 marks */
      if (node.marks && node.marks.length > 0) {
        for (const mark of node.marks) {
          if (mark.type.name === markType) {
            /** 检查 mark 的 attributes 中是否有匹配的 id */
            const markIdAttr = mark.attrs?.id || mark.attrs?.commentId || mark.attrs?.markId || mark.attrs[`${markType}Id`]
            if (markIdAttr === markId) {
              foundPos = pos
              return false // 找到后停止遍历
            }
          }
        }
      }

      return true // 继续遍历
    })

    if (foundPos !== null) {
      return scrollToRange(editor, foundPos, options)
    }

    console.warn(`Mark with id "${markId}" of type "${markType}" not found`)
    return false
  }
  catch (error) {
    console.error('Error scrolling to mark:', error)
    return false
  }
}

/**
 * 在文档中查找文本的位置
 * @param editor Tiptap 编辑器实例
 * @param searchText 要搜索的文本
 * @param caseSensitive 是否区分大小写
 * @returns 返回文本在文档中的位置范围 { from, to }，如果未找到则返回 null
 */
function findTextPosition(
  editor: Editor | null,
  searchText: string,
  caseSensitive: boolean = false,
): { from: number, to: number } | null {
  if (!editor || !editor.state || !editor.view) {
    return null
  }

  if (!searchText || searchText.trim().length === 0) {
    return null
  }

  try {
    const { state } = editor
    const { doc } = state
    const fullText = doc.textContent
    const searchPattern = caseSensitive
      ? searchText
      : searchText.toLowerCase()
    const textToSearch = caseSensitive
      ? fullText
      : fullText.toLowerCase()

    const index = textToSearch.indexOf(searchPattern)
    if (index === -1) {
      console.warn(`Text "${searchText}" not found in document`)
      return null
    }

    /** 将文本索引转换为文档位置 */
    let currentTextPos = 0
    let foundFrom: number | null = null
    let foundTo: number | null = null

    doc.descendants((node: PMNode, pos: number) => {
      if (foundFrom !== null && foundTo !== null) {
        return false
      }

      if (node.isText && node.text) {
        const nodeText = caseSensitive
          ? node.text
          : node.text.toLowerCase()
        const nodeTextLength = nodeText.length

        /** 检查文本是否在这个节点中 */
        if (
          currentTextPos <= index
          && index < currentTextPos + nodeTextLength
        ) {
          /** 找到了包含目标文本的节点 */
          const offsetInNode = index - currentTextPos
          foundFrom = pos + offsetInNode
          foundTo = pos + offsetInNode + searchText.length
          return false
        }

        currentTextPos += nodeTextLength
      }

      return true
    })

    if (foundFrom !== null && foundTo !== null) {
      return { from: foundFrom, to: foundTo }
    }

    return null
  }
  catch (error) {
    console.error('Error finding text position:', error)
    return null
  }
}

/**
 * 选择并滚动到指定文本内容
 * 这是一个便捷函数，可以同时选择文本并滚动到该位置
 * @param editor Tiptap 编辑器实例
 * @param searchText 要搜索的文本
 * @param options 滚动选项
 * @param caseSensitive 是否区分大小写
 * @returns 是否成功找到并滚动到文本
 */
export function selectAndScrollToText(
  editor: Editor | null,
  searchText: string,
  options: ScrollToRangeOptions = {},
  caseSensitive: boolean = false,
): boolean {
  const position = findTextPosition(editor, searchText, caseSensitive)
  if (!position) {
    return false
  }

  /** 选择文本并滚动 */
  return scrollToRangeSelection(editor, position.from, position.to, {
    ...options,
    setSelection: true, // 强制设置选区
  })
}

/**
 * 滚动到指定文本的位置（不选择文本）
 * @param editor Tiptap 编辑器实例
 * @param searchText 要搜索的文本
 * @param options 滚动选项
 * @param caseSensitive 是否区分大小写
 * @returns 是否成功找到并滚动到文本
 */
export function scrollToText(
  editor: Editor | null,
  searchText: string,
  options: ScrollToRangeOptions = {},
  caseSensitive: boolean = false,
): boolean {
  const position = findTextPosition(editor, searchText, caseSensitive)
  if (!position) {
    return false
  }

  /** 滚动到文本的开始位置 */
  return scrollToRange(editor, position.from, options)
}
