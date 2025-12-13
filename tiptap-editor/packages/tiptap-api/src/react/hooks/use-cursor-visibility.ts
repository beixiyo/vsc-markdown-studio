import type { Editor } from '@tiptap/react'
import { useEffect } from 'react'
import { useBodyRect } from './use-element-rect'
import { useWindowSize } from './use-window-size'

export interface CursorVisibilityOptions {
  /**
   * Tiptap 编辑器实例
   */
  editor?: Editor | null
  /**
   * 可能遮挡光标的工具栏元素引用
   */
  overlayHeight?: number
}

/**
 * 确保 Tiptap 编辑器中光标可见性的自定义 Hook
 *
 * 当用户在编辑器中输入时，如果光标被工具栏或其他元素遮挡，
 * 此 Hook 会自动滚动窗口，使光标保持在可见区域内。
 * 这对于提供流畅的编辑体验非常重要，特别是在移动设备上。
 *
 * @example
 * ```tsx
 * const MyEditor = () => {
 *   const editor = useEditor({...});
 *   const rect = useCursorVisibility({
 *     editor,
 *     overlayHeight: 60 // 工具栏高度
 *   });
 *
 *   return <TiptapEditor editor={editor} />;
 * };
 * ```
 *
 * @param options - 配置选项
 * @param options.editor - Tiptap 编辑器实例，当编辑器存在且获得焦点时触发滚动
 * @param options.overlayHeight - 需要考虑的工具栏或其他遮挡元素的高度（像素），默认为 0
 * @returns 文档主体的边界矩形，可用于其他布局计算
 */
export function useCursorVisibility({
  editor,
  overlayHeight = 0,
}: CursorVisibilityOptions) {
  const { height: windowHeight } = useWindowSize()
  const rect = useBodyRect({
    enabled: true,
    throttleMs: 100,
    useResizeObserver: true,
  })

  useEffect(() => {
    const ensureCursorVisibility = () => {
      if (!editor)
        return

      const { state, view } = editor
      if (!view.hasFocus())
        return

      /** 获取当前光标位置坐标 */
      const { from } = state.selection
      const cursorCoords = view.coordsAtPos(from)

      if (windowHeight < rect.height && cursorCoords) {
        const availableSpace = windowHeight - cursorCoords.top

        /** 如果光标被遮挡层隐藏或超出屏幕，滚动到可见位置 */
        if (availableSpace < overlayHeight) {
          const targetCursorY = Math.max(windowHeight / 2, overlayHeight)
          const currentScrollY = window.scrollY
          const cursorAbsoluteY = cursorCoords.top + currentScrollY
          const newScrollY = cursorAbsoluteY - targetCursorY

          window.scrollTo({
            top: Math.max(0, newScrollY),
            behavior: 'smooth',
          })
        }
      }
    }

    ensureCursorVisibility()
  }, [editor, overlayHeight, windowHeight, rect.height])

  return rect
}
