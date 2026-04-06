import type { Editor } from '@tiptap/react'
import type { EditorView } from '@tiptap/pm/view'

import type { HoverPosition } from './types'

/**
 * 从鼠标坐标获取文档位置（ProseMirror EditorView，供扩展内使用）
 */
export function getHoverPositionFromView(
  view: EditorView | null,
  coords: { left: number, top: number },
): HoverPosition | null {
  if (!view) {
    return null
  }

  try {
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
 * 从鼠标坐标获取文档位置
 * @param editor Tiptap 编辑器实例
 * @param coords 鼠标坐标 { left: clientX, top: clientY }
 * @returns 位置信息，如果无法获取则返回 null
 */
export function getHoverPosition(
  editor: Editor | null,
  coords: { left: number, top: number },
): HoverPosition | null {
  if (!editor?.view) {
    return null
  }
  return getHoverPositionFromView(editor.view, coords)
}
