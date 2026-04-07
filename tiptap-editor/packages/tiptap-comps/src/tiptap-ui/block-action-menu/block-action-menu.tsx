'use client'

import type { BlockActionMenuProps } from './types'
import { TextSelection } from '@tiptap/pm/state'
import { SafePortal } from 'comps'
import { getScrollParents, useFloatingPosition } from 'hooks'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { getEditorElement } from 'tiptap-utils'
import { DragHandleIcon } from '../../icons'

export const BlockActionMenu = memo<BlockActionMenuProps>(({ editor, enabled = true }) => {
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

  const hideMenu = useCallback(() => {
    if (hideTimerRef.current)
      return
    hideTimerRef.current = setTimeout(() => {
      setHoverNodePos(null)
      hideTimerRef.current = null
    }, 500) // 延迟 500ms 隐藏，给用户移动鼠标的时间
  }, [])

  const showMenu = useCallback((pos: number) => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
    setHoverNodePos(pos)
  }, [])

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

      // 💡 在这里设置 top 的偏移量
      // 把高度设置为 0，配合下方的 'bottom-start'，可以使得菜单的绝对 Top 精确对齐到这里的 Y 坐标
      // 如果觉得 rect.top 还是太高，可以在这里微调，例如：rect.top + 2
      const topOffset = rect.top + 2
      return new DOMRect(editorRect.left - 24, topOffset, 0, 0)
    }
    catch (e) {
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

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!editor || !editor.view || !enabled) {
      hideMenu()
      return
    }

    const view = editor.view
    const coords = { left: event.clientX, top: event.clientY }
    const pos = view.posAtCoords(coords)

    if (!pos) {
      hideMenu()
      return
    }

    const $pos = view.state.doc.resolve(pos.pos)
    let blockPos = -1

    /** 查找最近的块级节点 */
    for (let depth = $pos.depth; depth > 0; depth--) {
      const node = $pos.node(depth)
      if (node.isBlock) {
        blockPos = $pos.before(depth)
        break
      }
    }

    if (blockPos !== -1) {
      showMenu(blockPos)
    }
    else {
      hideMenu()
    }
  }, [editor, enabled, hideMenu, showMenu])

  const handleMouseLeave = useCallback((e: MouseEvent) => {
    /** 如果移动到了拖拽手柄本身，不隐藏 */
    const relatedTarget = e.relatedTarget as HTMLElement
    if (relatedTarget && relatedTarget.closest('[data-block-action-menu]')) {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current)
        hideTimerRef.current = null
      }
      return
    }
    hideMenu()
  }, [hideMenu])

  useEffect(() => {
    if (!editor || !enabled)
      return
    const element = getEditorElement(editor)
    if (!element)
      return

    element.addEventListener('mousemove', handleMouseMove)
    element.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      element.removeEventListener('mousemove', handleMouseMove)
      element.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [editor, enabled, handleMouseMove, handleMouseLeave])

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current)
      }
    }
  }, [])

  if (!enabled || hoverNodePos === null || !editor) {
    return null
  }

  return (
    <SafePortal target={ scrollContainer !== document.body ? scrollContainer : undefined }>
      <div
        ref={ floatingRef }
        data-block-action-menu="true"
        className="z-50 flex items-center justify-center w-5 h-6 cursor-pointer text-text2 hover:bg-background2 hover:text-text rounded transition-colors"
        style={ floatingStyle }
        onClick={ () => {
          /** 选中该块的文本内容 */
          const node = editor.state.doc.nodeAt(hoverNodePos)

          if (node) {
            const selection = TextSelection.create(editor.state.doc, hoverNodePos, hoverNodePos + node.nodeSize)
            editor.view.dispatch(editor.state.tr.setSelection(selection))
            editor.view.focus()
          }
        } }
        onMouseEnter={ () => {
          if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current)
            hideTimerRef.current = null
          }
        } }
        onMouseLeave={ (e) => {
          /** 如果移动回编辑器，不立即隐藏，由编辑器的 mousemove/mouseleave 处理 */
          const relatedTarget = e.relatedTarget as HTMLElement
          if (relatedTarget && relatedTarget.closest('.tiptap')) {
            return
          }
          hideMenu()
        } }
      >
        <DragHandleIcon />
      </div>
    </SafePortal>
  )
})

BlockActionMenu.displayName = 'BlockActionMenu'
