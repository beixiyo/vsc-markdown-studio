'use client'

import type { SelectionToolbarProps } from './types'
import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
} from '@floating-ui/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getSelectionRect as getApiSelectionRect, hasSelectedText } from 'tiptap-api'
import { useTiptapEditor } from 'tiptap-api/react'
import { cn } from 'utils'
import { SELECTION_TOOLBAR_KEEP_OPEN_ATTR } from 'tiptap-utils'

/**
 * 选中文本工具栏组件
 * 当用户选中文本时，在选中文本上方显示工具栏
 */
export function SelectionToolbar({
  editor: providedEditor,
  enabled = true,
  children,
  offsetDistance = 8,
  placement = 'top-start',
  className = '',
  editorSelector = '.tiptap',
}: SelectionToolbarProps) {
  const { editor } = useTiptapEditor(providedEditor)
  const [hasSelection, setHasSelection] = useState(false)
  const updateTimeoutRef = useRef<number | undefined>(undefined)
  const toolbarRef = useRef<HTMLDivElement | null>(null)

  /** 获取选中文本的 DOM 位置（实时计算，不缓存） */
  const getSelectionRect = useCallback(() => {
    return getApiSelectionRect(editor)
  }, [editor])

  /** 创建虚拟元素，getBoundingClientRect 总是返回最新的位置 */
  const virtualElement = useMemo(() => {
    if (!editor) {
      return null
    }

    let viewDom: HTMLElement | undefined
    try {
      viewDom = editor.view?.dom
    }
    catch (e) {
      // 视图不可用
    }

    return {
      getBoundingClientRect: () => {
        const rect = getSelectionRect()
        if (!rect) {
          /** 返回一个默认的 rect，避免 Floating UI 报错 */
          return {
            width: 0,
            height: 0,
            x: 0,
            y: 0,
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
          } as DOMRect
        }
        return rect
      },
      contextElement: viewDom,
    }
  }, [editor, getSelectionRect])

  /**
   * 构建 middleware 数组
   * 完全交给 Floating UI 处理滚动与位置更新，避免与手动更新逻辑“打架”
   */
  const middleware = useMemo(
    () => [
      offset(offsetDistance),
      flip({
        fallbackAxisSideDirection: 'start',
        padding: 8,
        crossAxis: false,
      }),
      shift({
        padding: 8,
        crossAxis: false,
      }),
    ],
    [offsetDistance],
  )

  /** 使用 Floating UI 进行智能定位 */
  const { refs, floatingStyles, context, isPositioned } = useFloating({
    placement: placement || 'top-start',
    open: hasSelection && enabled,
    whileElementsMounted: autoUpdate,
    middleware,
  })

  /** 添加浮层交互，统一处理点击外部关闭等逻辑 */
  const dismiss = useDismiss(context)
  const { getFloatingProps } = useInteractions([dismiss])

  /** 更新虚拟元素引用 */
  useEffect(() => {
    if (hasSelection && enabled && virtualElement) {
      refs.setReference(virtualElement)
    }
  }, [hasSelection, enabled, virtualElement, refs])

  /** 统一更新工具栏显示状态 */
  const updateToolbarState = useCallback(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }

    /** 使用 setTimeout 确保 DOM 已更新 */
    updateTimeoutRef.current = window.setTimeout(() => {
      if (!editor) {
        setHasSelection(false)
        return
      }

      const has = hasSelectedText(editor)
      setHasSelection(has)
    }, 0)
  }, [editor])

  /** 监听事件 */
  useEffect(() => {
    if (!enabled || !editor) {
      setHasSelection(false)
      return
    }

    let editorElement: HTMLElement | null = null
    try {
      editorElement = editor.view.dom as HTMLElement
    }
    catch (e) {
      // 视图不可用，暂不绑定事件
      return
    }

    if (!editorElement) {
      return
    }

    const currentEditorElement = editorElement

    /** 监听鼠标松开事件（在编辑器内） */
    const handleMouseUp = (event: MouseEvent) => {
      /** 检查事件是否发生在编辑器内 */
      if (currentEditorElement.contains(event.target as Node)) {
        updateToolbarState()
      }
    }

    /** 监听点击事件（点击其他地方时隐藏工具栏） */
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node
      const toolbarElement = toolbarRef.current

      if (!toolbarElement) {
        return
      }

      /** 检查是否点击在需要保持工具栏打开的区域（例如 AI 输入弹窗） */
      const keepOpenElement = target instanceof HTMLElement
        ? target.closest(`[${SELECTION_TOOLBAR_KEEP_OPEN_ATTR}]`)
        : null

      /** 如果点击的不是编辑器、不是工具栏本身、也不是需要保持打开的区域，则更新工具栏状态 */
      if (
        !currentEditorElement.contains(target)
        && !toolbarElement.contains(target)
        && !keepOpenElement
      ) {
        updateToolbarState()
      }
    }

    /** 监听选中变化（每次选择变化时都更新工具栏状态） */
    const handleSelectionUpdate = () => {
      updateToolbarState()
    }

    /** 监听文档更新（可能影响选中位置，每次更新时都检查工具栏状态） */
    const handleUpdate = () => {
      // Floating UI 使用 autoUpdate 自动感知布局变化
      /** 每次更新时都检查选择状态，确保工具栏正确显示/隐藏 */
      updateToolbarState()
    }

    /** 监听键盘事件（支持键盘选择文本） */
    const handleKeyUp = (event: KeyboardEvent) => {
      /** 检查编辑器是否获得焦点 */
      const isEditorFocused = currentEditorElement === document.activeElement
        || currentEditorElement.contains(document.activeElement)

      if (!isEditorFocused) {
        return
      }

      /** 检查是否是选择相关的按键（Shift + 方向键、Ctrl/Cmd + A 等） */
      const isSelectionKey = event.shiftKey
        || (event.ctrlKey || event.metaKey) && event.key === 'a'
        || event.key === 'ArrowLeft'
        || event.key === 'ArrowRight'
        || event.key === 'ArrowUp'
        || event.key === 'ArrowDown'

      if (isSelectionKey) {
        updateToolbarState()
      }
    }

    /** 添加事件监听器 */
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('click', handleClick, true)
    document.addEventListener('keyup', handleKeyUp)
    editor.on('selectionUpdate', handleSelectionUpdate)
    editor.on('update', handleUpdate)

    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('click', handleClick, true)
      document.removeEventListener('keyup', handleKeyUp)
      editor.off('selectionUpdate', handleSelectionUpdate)
      editor.off('update', handleUpdate)
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
    }
  }, [enabled, editor, editorSelector, updateToolbarState])

  /** 如果没有选中或未启用，不显示工具栏 */
  if (!hasSelection || !enabled || !virtualElement) {
    return null
  }

  /** 检查是否有有效的选中区域 */
  const currentRect = getSelectionRect()
  if (!currentRect) {
    return null
  }

  /** 如果没有 children，不渲染任何内容 */
  if (!children) {
    return null
  }

  return (
    <FloatingPortal>
      <div
        ref={ (node) => {
          toolbarRef.current = node
          refs.setFloating(node)
        } }
        className={ cn(
          'bn-toolbar flex items-center gap-1 px-1.5 py-1 max-w-[100vw] bg-background text-textSecondary rounded-lg shadow-lg z-50',
          className,
        ) }
        style={ {
          ...floatingStyles,
          opacity: isPositioned ? 1 : 0,
        } }
        { ...getFloatingProps() }
      >
        { children }
      </div>
    </FloatingPortal>
  )
}
