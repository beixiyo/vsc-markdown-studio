import type { Node as PMNode, ResolvedPos } from '@tiptap/pm/model'
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
 * getHoverContent / getHoverContentFromCoords 的可选配置
 */
export interface GetHoverContentOptions {
  /**
   * 是否填充当前块（文档模型中的块级节点）的全文与范围
   * @default true
   */
  includeBlock?: boolean
  /**
   * 是否按块内硬换行（hardBreak 等）切分并填充当前「逻辑行」文本
   * 注意：浏览器因宽度折行的「视觉行」不在 ProseMirror 模型内，无法由此字段得到
   * @default true
   */
  includeLineInBlock?: boolean
  /**
   * 以 pos 为中心向两侧扩展的字符数，用于 `contextText`；为 0 时不填充上下文
   * @default 160
   */
  contextRadius?: number
}

/**
 * Hover 时获取到的内容信息
 *
 * **能力边界**：
 * - `textContent`：当前解析位置下的**单个文本叶子**或邻近叶子，故往往只有几个字符。
 * - `blockText`：当前**块级节点**内全部文本（段落整段、标题整段、代码块全文等）。
 * - `lineInBlockText`：块内按 **hardBreak / 叶子换行** 切分的逻辑行；**不是** CSS 折行后的屏幕行。
 * - `contextText`：文档中连续字符窗口；跨块时含块分隔符换行。
 * - **视觉行**（自动换行）：需用 `caretRangeFromPoint` 等与 DOM 布局结合，本模块不实现。
 */
export interface HoverContent {
  /** 文档位置 */
  pos: number
  /** 文本节点内容（如果存在）——通常为当前叶子的全文，长度较短 */
  textContent?: string
  /** 所在的块节点类型 */
  blockType?: string
  /** 块节点的属性 */
  blockAttrs?: Record<string, unknown>
  /** 块级节点在文档中的 inner 范围 [blockFrom, blockTo) */
  blockFrom?: number
  blockTo?: number
  /** 当前块内全部纯文本（与模型一致，硬换行会反映为 \\n） */
  blockText?: string
  /**
   * 光标所在「逻辑行」：块内按硬换行切分后包含 pos 的那一段（无硬换行时等于整段）
   */
  lineInBlockText?: string
  /** 上述逻辑行在块内的序号，从 0 开始 */
  lineInBlockIndex?: number
  /** 以 pos 为中心截取的上下文（长度约 2 * contextRadius） */
  contextText?: string
  contextFrom?: number
  contextTo?: number
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
 * 将叶子节点中的「硬换行」映射为 \\n，便于按逻辑行切分
 */
function leafTextWithHardBreaks(node: PMNode): string {
  if (node.type.name === 'hardBreak')
    return '\n'
  return ''
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
 * 光标所在最内层块级节点深度（不含 doc）
 */
function findInnermostBlockDepth($pos: ResolvedPos): number {
  for (let d = $pos.depth; d > 0; d--) {
    if ($pos.node(d).isBlock)
      return d
  }
  return 0
}

/**
 * 从文档位置提取内容信息
 * @param editor Tiptap 编辑器实例
 * @param pos 文档位置
 * @param options 扩展字段开关与上下文长度
 * @returns 内容信息，如果位置无效则返回 null
 */
export function getHoverContent(
  editor: Editor | null,
  pos: number,
  options: GetHoverContentOptions = {},
): HoverContent | null {
  if (!editor || !editor.state) {
    return null
  }

  const {
    includeBlock = true,
    includeLineInBlock = true,
    contextRadius = 160,
  } = options

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

    let blockType: string | undefined
    let blockAttrs: Record<string, unknown> | undefined
    let parentType: string | undefined
    let blockFrom: number | undefined
    let blockTo: number | undefined
    let blockText: string | undefined
    let lineInBlockText: string | undefined
    let lineInBlockIndex: number | undefined
    let contextText: string | undefined
    let contextFrom: number | undefined
    let contextTo: number | undefined

    const blockDepth = findInnermostBlockDepth($pos)
    if (blockDepth > 0) {
      const blockNode = $pos.node(blockDepth)
      blockType = blockNode.type.name
      blockAttrs = blockNode.attrs
      blockFrom = $pos.start(blockDepth)
      blockTo = $pos.end(blockDepth)

      if (includeBlock) {
        blockText = doc.textBetween(blockFrom, blockTo, '\n', leafTextWithHardBreaks)
      }

      if (includeLineInBlock && blockText !== undefined) {
        const clamped = Math.min(Math.max(pos, blockFrom), blockTo)
        const prefix = doc.textBetween(blockFrom, clamped, '\n', leafTextWithHardBreaks)
        lineInBlockIndex = prefix.length === 0
          ? 0
          : (prefix.match(/\n/g)?.length ?? 0)
        const lines = blockText.split('\n')
        lineInBlockText = lines[lineInBlockIndex] ?? ''
      }
    }
    else {
      /** 极端情况：未解析到块，回退为旧版名称扫描 */
      for (let depth = $pos.depth; depth > 0; depth--) {
        const nodeAtDepth = $pos.node(depth)
        const nodeType = nodeAtDepth.type

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
      }
    }

    parentType = $pos.depth > 0
      ? $pos.parent.type.name
      : undefined

    if (contextRadius > 0) {
      contextFrom = Math.max(0, pos - contextRadius)
      contextTo = Math.min(doc.content.size, pos + contextRadius)
      contextText = doc.textBetween(contextFrom, contextTo, '\n', leafTextWithHardBreaks)
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
      blockFrom,
      blockTo,
      blockText,
      lineInBlockText,
      lineInBlockIndex,
      contextText,
      contextFrom,
      contextTo,
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
 * @param options 与 getHoverContent 相同
 * @returns 内容信息，如果无法获取则返回 null
 */
export function getHoverContentFromCoords(
  editor: Editor | null,
  coords: { left: number, top: number },
  options?: GetHoverContentOptions,
): HoverContent | null {
  const position = getHoverPosition(editor, coords)
  if (!position) {
    return null
  }

  return getHoverContent(editor, position.pos, options)
}
