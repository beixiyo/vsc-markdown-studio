import type { EditorState } from '@tiptap/pm/state'
import type { EditorView } from '@tiptap/pm/view'
import type { Editor } from '@tiptap/react'

import type { GetHoverContentOptions, HoverContent } from './types'
import {
  docPosAtFlatOffset,
  findInnermostBlockDepth,
  leafTextWithHardBreaks,
} from './internal'
import { getHoverPosition, getHoverPositionFromView } from './position'

/**
 * 从文档位置提取内容信息（仅依赖 EditorState，供扩展 / PM 插件使用）
 */
export function getHoverContentAtPos(
  state: EditorState,
  pos: number,
  options: GetHoverContentOptions = {},
): HoverContent | null {
  const {
    includeBlock = false,
    includeLineInBlock = true,
    contextRadius = 0,
  } = options

  try {
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
    let blockFromOut: number | undefined
    let blockToOut: number | undefined
    let blockText: string | undefined
    let lineInBlockText: string | undefined
    let lineInBlockIndex: number | undefined
    let lineInBlockFrom: number | undefined
    let lineInBlockTo: number | undefined
    let contextText: string | undefined
    let contextFrom: number | undefined
    let contextTo: number | undefined

    const blockDepth = findInnermostBlockDepth($pos)
    if (blockDepth > 0) {
      const blockNode = $pos.node(blockDepth)
      blockType = blockNode.type.name
      blockAttrs = blockNode.attrs
      const blockFrom = $pos.start(blockDepth)
      const blockTo = $pos.end(blockDepth)

      if (includeBlock) {
        blockFromOut = blockFrom
        blockToOut = blockTo
        blockText = doc.textBetween(blockFrom, blockTo, '\n', leafTextWithHardBreaks)
      }

      /** 逻辑行始终基于块内扁平串计算，与是否导出 blockText 无关 */
      if (includeLineInBlock) {
        const blockFlat = doc.textBetween(blockFrom, blockTo, '\n', leafTextWithHardBreaks)
        const clamped = Math.min(Math.max(pos, blockFrom), blockTo)
        const prefix = doc.textBetween(blockFrom, clamped, '\n', leafTextWithHardBreaks)
        lineInBlockIndex = prefix.length === 0
          ? 0
          : (prefix.match(/\n/g)?.length ?? 0)
        const lines = blockFlat.split('\n')
        lineInBlockText = lines[lineInBlockIndex] ?? ''

        const lineStr = lineInBlockText
        let startOffset = 0
        for (let i = 0; i < lineInBlockIndex; i++)
          startOffset += (lines[i]?.length ?? 0) + 1

        const endExclusive = startOffset + lineStr.length
        if (lineStr.length > 0) {
          const lf = docPosAtFlatOffset(doc, blockFrom, blockTo, startOffset)
          const lt = docPosAtFlatOffset(doc, blockFrom, blockTo, endExclusive)
          if (lf != null && lt != null && lf < lt) {
            lineInBlockFrom = lf
            lineInBlockTo = lt
          }
        }
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

    const parentType = $pos.depth > 0
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
      blockFrom: blockFromOut,
      blockTo: blockToOut,
      blockText,
      lineInBlockText,
      lineInBlockIndex,
      lineInBlockFrom,
      lineInBlockTo,
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
  if (!editor?.state) {
    return null
  }
  return getHoverContentAtPos(editor.state, pos, options)
}

/**
 * 从 EditorView 的视口坐标获取 hover 内容（扩展内指针同步用）
 */
export function getHoverContentFromViewCoords(
  view: EditorView,
  coords: { left: number, top: number },
  options?: GetHoverContentOptions,
): HoverContent | null {
  const position = getHoverPositionFromView(view, coords)
  if (!position) {
    return null
  }
  return getHoverContentAtPos(view.state, position.pos, options)
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
  if (!position || !editor?.state) {
    return null
  }

  return getHoverContentAtPos(editor.state, position.pos, options)
}
