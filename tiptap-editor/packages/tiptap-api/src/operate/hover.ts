import type { Editor } from '@tiptap/react'

/**
 * Hover 位置信息
 */
export interface HoverPosition {
  /** 文档位置 */
  pos: number
  /** 是否在有效位置 */
  inside: number
}

/**
 * Hover 时获取到的内容信息
 */
export interface HoverContent {
  /** 文档位置 */
  pos: number
  /** 文本节点内容（如果存在） */
  textContent?: string
  /** 所在的块节点类型（paragraph, heading, list_item 等） */
  blockType?: string
  /** 块节点的属性 */
  blockAttrs?: Record<string, unknown>
  /** 所有应用的 marks */
  marks: Array<{
    type: string
    attrs?: Record<string, unknown>
  }>
  /** 是否在文本节点上 */
  isText: boolean
  /** 父节点类型（如果有） */
  parentType?: string
}

/**
 * 从鼠标坐标获取文档位置
 * @param editor Tiptap 编辑器实例
 * @param coords 鼠标坐标 { left: clientX, top: clientY }
 * @returns 位置信息，如果无法获取则返回 null
 */
export function getHoverPosition(
  editor: Editor | null,
  coords: { left: number, top: number },
): HoverPosition | null {
  if (!editor || !editor.view) {
    return null
  }

  try {
    const { view } = editor
    const pos = view.posAtCoords(coords)

    if (!pos) {
      return null
    }

    return {
      pos: pos.pos,
      inside: pos.inside,
    }
  }
  catch (error) {
    console.error('Error getting hover position:', error)
    return null
  }
}

/**
 * 从文档位置提取内容信息
 * @param editor Tiptap 编辑器实例
 * @param pos 文档位置
 * @returns 内容信息，如果位置无效则返回 null
 */
export function getHoverContent(
  editor: Editor | null,
  pos: number,
): HoverContent | null {
  if (!editor || !editor.state) {
    return null
  }

  try {
    const { state } = editor
    const { doc } = state

    /** 验证位置是否有效 */
    if (pos < 0 || pos > doc.content.size) {
      return null
    }

    /** 解析位置 */
    const $pos = doc.resolve(pos)
    const node = $pos.node()

    /** 获取文本内容 */
    let textContent: string | undefined
    let isText = false

    if (node.isText) {
      textContent = node.text
      isText = true
    }
    else if ($pos.parentOffset < $pos.parent.content.size) {
      /** 如果不在文本节点上，尝试获取附近的文本 */
      const textNode = $pos.nodeAfter
      if (textNode?.isText) {
        textContent = textNode.text
        isText = true
      }
    }

    /** 获取块类型（向上查找块级节点） */
    let blockType: string | undefined
    let blockAttrs: Record<string, unknown> | undefined
    let parentType: string | undefined

    /** 从当前位置向上查找块级节点 */
    for (let depth = $pos.depth; depth > 0; depth--) {
      const nodeAtDepth = $pos.node(depth)
      const nodeType = nodeAtDepth.type

      /** 常见的块级节点类型 */
      if (
        nodeType.name === 'paragraph'
        || nodeType.name === 'heading'
        || nodeType.name === 'blockquote'
        || nodeType.name === 'codeBlock'
        || nodeType.name === 'listItem'
        || nodeType.name === 'taskItem'
      ) {
        blockType = nodeType.name
        blockAttrs = nodeAtDepth.attrs
        break
      }

      /** 记录父节点类型 */
      if (depth === $pos.depth && !blockType) {
        parentType = nodeType.name
      }
    }

    /** 获取所有 marks */
    const marks: Array<{ type: string, attrs?: Record<string, unknown> }> = []

    /** 从当前节点获取 marks */
    if (node.marks && node.marks.length > 0) {
      for (const mark of node.marks) {
        marks.push({
          type: mark.type.name,
          attrs: mark.attrs,
        })
      }
    }
    else {
      /** 如果当前节点没有 marks，尝试从父节点获取 */
      const storedMarks = $pos.marks()
      for (const mark of storedMarks) {
        marks.push({
          type: mark.type.name,
          attrs: mark.attrs,
        })
      }
    }

    return {
      pos,
      textContent,
      blockType,
      blockAttrs,
      marks,
      isText,
      parentType,
    }
  }
  catch (error) {
    console.error('Error getting hover content:', error)
    return null
  }
}

/**
 * 从鼠标坐标直接获取 hover 内容信息
 * 这是一个便捷函数，结合了 getHoverPosition 和 getHoverContent
 * @param editor Tiptap 编辑器实例
 * @param coords 鼠标坐标 { left: clientX, top: clientY }
 * @returns 内容信息，如果无法获取则返回 null
 */
export function getHoverContentFromCoords(
  editor: Editor | null,
  coords: { left: number, top: number },
): HoverContent | null {
  const position = getHoverPosition(editor, coords)
  if (!position) {
    return null
  }

  return getHoverContent(editor, position.pos)
}
