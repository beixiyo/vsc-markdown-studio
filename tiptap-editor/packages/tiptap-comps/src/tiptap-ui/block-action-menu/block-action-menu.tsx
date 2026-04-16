'use client'

import type { BlockActionMenuProps, BlockActionShouldShow } from './types'
import { TextSelection } from '@tiptap/pm/state'
import { AnimateShow, SafePortal } from 'comps'
import { getScrollParents, useFloatingPosition } from 'hooks'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { useHoverDetection } from 'tiptap-hover/react'
import { getEditorElement } from 'tiptap-utils'
import { DragHandleIcon } from '../../icons'
import { useBlockDrag } from './use-block-drag'

/** 默认判断：光标位于 table 祖先链上时不显示（由 TableControls 接管） */
const defaultShouldShow: BlockActionShouldShow = ({ $pos }) => {
  for (let depth = $pos.depth; depth > 0; depth--) {
    if ($pos.node(depth).type.name === 'table')
      return false
  }
  return true
}

export const BlockActionMenu = memo<BlockActionMenuProps>(({
  editor,
  enabled = true,
  hideDelay = 500,
  shouldShow = defaultShouldShow,
}) => {
  const [hoverNodePos, setHoverNodePos] = useState<number | null>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [scrollContainer, setScrollContainer] = useState<HTMLElement | null>(null)
  const floatingRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (editor && editor.view && typeof document !== 'undefined') {
      const editorElement = getEditorElement(editor)
      if (editorElement) {
        const parent = getScrollParents(editorElement)[0] ?? document.body
        setScrollContainer(parent as HTMLElement)
      }
    }
  }, [editor])

  useEffect(() => {
    if (!scrollContainer || scrollContainer === document.body)
      return
    const prev = scrollContainer.style.position
    if (getComputedStyle(scrollContainer).position === 'static') {
      scrollContainer.style.position = 'relative'
    }
    return () => {
      if (prev === '')
        scrollContainer.style.position = ''
      else scrollContainer.style.position = prev
    }
  }, [scrollContainer])

  const cancelHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }, [])

  const hideMenu = useCallback(() => {
    if (hideTimerRef.current)
      return
    hideTimerRef.current = setTimeout(() => {
      setHoverNodePos(null)
      hideTimerRef.current = null
    }, hideDelay)
  }, [hideDelay])

  const showMenu = useCallback((pos: number) => {
    cancelHideTimer()
    setHoverNodePos(pos)
  }, [cancelHideTimer])

  const getVirtualReferenceRect = useCallback(() => {
    if (!editor || !editor.view || hoverNodePos === null)
      return null
    try {
      const dom = editor.view.nodeDOM(hoverNodePos) as HTMLElement
      if (!dom || !dom.getBoundingClientRect)
        return null

      const rect = dom.getBoundingClientRect()
      const editorElement = getEditorElement(editor)
      if (!editorElement)
        return null

      const editorRect = editorElement.getBoundingClientRect()

      /** 动态读取编辑器的 paddingLeft 作为偏移量，避免硬编码 -24 */
      const computedStyle = window.getComputedStyle(editorElement)
      const paddingLeft = Number.parseFloat(computedStyle.paddingLeft) || 24

      /** 把高度设置为 0，配合下方的 'bottom-start'，可以使得菜单的绝对 Top 精确对齐到这里的 Y 坐标 */
      const topOffset = rect.top + 2
      return new DOMRect(editorRect.left - paddingLeft, topOffset, 0, 0)
    }
    catch (e) {
      console.warn('[BlockActionMenu] failed to get reference rect:', e)
      return null
    }
  }, [editor, hoverNodePos])

  const { style: floatingStyle } = useFloatingPosition(
    { current: null },
    floatingRef,
    {
      enabled: enabled && hoverNodePos !== null,
      getVirtualReferenceRect,
      placement: 'bottom-start', // 💡 改为 bottom-start，让菜单的顶边对齐基准点的底边（也就是精确对齐 topOffset）
      offset: 0,
      flip: false,
      shift: false, // 禁用翻转和偏移约束，让它完全贴紧计算出的 DOMRect
      containerRef: { current: scrollContainer },
    },
  )

  const { hoverContent } = useHoverDetection({
    editor,
    enabled,
    throttleDelay: 50, // 减小延迟以提高鼠标追随性
  })

  useEffect(() => {
    if (!editor || !editor.view || !enabled) {
      hideMenu()
      return
    }

    if (!hoverContent) {
      hideMenu()
      return
    }

    const { pos } = hoverContent
    const $pos = editor.state.doc.resolve(pos)
    let blockPos = -1

    /** 沿祖先链向上查找最近的块级节点 */
    for (let depth = $pos.depth; depth > 0; depth--) {
      if ($pos.node(depth).isBlock) {
        blockPos = $pos.before(depth)
        break
      }
    }

    /** 把是否展示的最终决定权交给外部 predicate，可在此注入业务上下文（如排除特定节点） */
    if (blockPos !== -1 && !shouldShow({ editor, pos: blockPos, $pos })) {
      blockPos = -1
    }

    if (blockPos !== -1) {
      showMenu(blockPos)
    }
    else {
      hideMenu()
    }
  }, [hoverContent, editor, enabled, hideMenu, showMenu, shouldShow])

  useEffect(() => {
    return cancelHideTimer
  }, [cancelHideTimer])

  const { onDragStart, onDragEnd } = useBlockDrag(editor, hoverNodePos, hideMenu)

  if (!enabled || !editor) {
    return null
  }

  return (
    <SafePortal target={ scrollContainer !== document.body
      ? scrollContainer
      : undefined }>
      <AnimateShow
        show={ hoverNodePos !== null }
        variants="fade"
        duration={ 0.5 }
      >
        <div
          ref={ floatingRef }
          data-block-action-menu="true"
          draggable="true"
          className="z-50 flex items-center justify-center w-5 h-6 cursor-grab active:cursor-grabbing text-text2 hover:bg-background2 hover:text-text rounded transition-all duration-200 ease-out"
          style={ floatingStyle }
          onDragStart={ onDragStart }
          onDragEnd={ onDragEnd }
          onClick={ () => {
            /** 选中该块的文本内容 */
            if (hoverNodePos === null)
              return
            const node = editor.state.doc.nodeAt(hoverNodePos)

            if (node) {
              const selection = TextSelection.create(editor.state.doc, hoverNodePos, hoverNodePos + node.nodeSize)
              editor.view.dispatch(editor.state.tr.setSelection(selection))
              editor.view.focus()
            }
          } }
          onMouseEnter={ cancelHideTimer }
          onMouseLeave={ (e) => {
            /** 如果移动回编辑器，不立即隐藏，由编辑器的 useHoverDetection 处理 */
            const relatedTarget = e.relatedTarget as HTMLElement
            if (relatedTarget && relatedTarget.closest('.tiptap')) {
              return
            }
            hideMenu()
          } }
        >
          <DragHandleIcon />
        </div>
      </AnimateShow>
    </SafePortal>
  )
})

BlockActionMenu.displayName = 'BlockActionMenu'
