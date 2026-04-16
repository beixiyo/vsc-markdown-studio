'use client'

import type { TableControlsProps } from './types'
import { getScrollParents } from 'hooks'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { getEditorElement } from 'tiptap-utils'
import { TableAxisControls } from './table-axis-controls'
import { useTableHover } from './use-table-hover'

/**
 * 表格悬浮控制组件：鼠标悬停表格时在行左侧和列顶部显示添加/删除按钮。
 * 参考 BlockActionMenu 的 hover + floating 模式实现。
 */
export const TableControls = memo<TableControlsProps>(({
  editor,
  enabled = true,
  hideDelay = 400,
}) => {
  const [scrollContainer, setScrollContainer] = useState<HTMLElement | null>(null)
  const hoverInfo = useTableHover(editor, enabled && !!editor?.isEditable)

  /** 保持浮层在离开表格后短暂可见，避免闪烁 */
  const [visibleInfo, setVisibleInfo] = useState(hoverInfo)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  /** 当鼠标在浮层按钮上时，锁定不隐藏 */
  const isHoveringControlsRef = useRef(false)

  const cancelHide = useCallback(() => {
    isHoveringControlsRef.current = true
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }, [])

  const requestHide = useCallback(() => {
    isHoveringControlsRef.current = false
    hideTimerRef.current = setTimeout(() => {
      setVisibleInfo(null)
      hideTimerRef.current = null
    }, hideDelay)
  }, [])

  useEffect(() => {
    if (hoverInfo) {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current)
        hideTimerRef.current = null
      }
      setVisibleInfo(hoverInfo)
    }
    else if (!isHoveringControlsRef.current) {
      hideTimerRef.current = setTimeout(() => {
        setVisibleInfo(null)
        hideTimerRef.current = null
      }, hideDelay)
    }
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current)
      }
    }
  }, [hoverInfo])

  /** 获取滚动容器（与 BlockActionMenu 一致） */
  useEffect(() => {
    if (!editor?.view)
      return
    const editorEl = getEditorElement(editor)
    if (!editorEl)
      return
    const parent = getScrollParents(editorEl)[0] ?? document.body
    setScrollContainer(parent as HTMLElement)
  }, [editor])

  /** 为滚动容器设置 position: relative（与 BlockActionMenu 一致） */
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

  if (!enabled || !editor || !visibleInfo)
    return null

  return (
    <>
      <TableAxisControls
        axis="row"
        editor={ editor }
        hoverInfo={ visibleInfo }
        scrollContainer={ scrollContainer }
        onMouseEnter={ cancelHide }
        onMouseLeave={ requestHide }
      />
      <TableAxisControls
        axis="column"
        editor={ editor }
        hoverInfo={ visibleInfo }
        scrollContainer={ scrollContainer }
        onMouseEnter={ cancelHide }
        onMouseLeave={ requestHide }
      />
    </>
  )
})

TableControls.displayName = 'TableControls'
