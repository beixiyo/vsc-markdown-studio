import type { Editor } from '@tiptap/react'
import type { TableHoverInfo } from './types'
import { useLatestCallback } from 'hooks'
import { useEffect, useRef, useState } from 'react'
import { getEditorElement } from 'tiptap-utils'

const THROTTLE_MS = 50

/**
 * 检测鼠标在表格中的位置，返回悬停的行/列信息。
 * 当鼠标不在任何表格上时返回 null。
 */
export function useTableHover(editor: Editor | null, enabled: boolean) {
  const [hoverInfo, setHoverInfo] = useState<TableHoverInfo | null>(null)
  const lastTimeRef = useRef(0)
  const rafRef = useRef<number>(0)

  /** 清空悬停状态；若已为 null 则不触发 setState，避免下游无意义重渲染 */
  const clearHover = useLatestCallback(() => {
    setHoverInfo(prev => (prev === null
      ? prev
      : null))
  })

  const handleMouseMove = useLatestCallback((e: MouseEvent) => {
    const now = Date.now()
    if (now - lastTimeRef.current < THROTTLE_MS)
      return
    lastTimeRef.current = now

    if (rafRef.current)
      cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const target = e.target as HTMLElement
      if (!target) {
        clearHover()
        return
      }

      /** 查找最近的 td/th 和 table */
      const cellEl = target.closest('td, th') as HTMLTableCellElement | null
      const tableEl = target.closest('table') as HTMLTableElement | null

      if (!tableEl || !cellEl) {
        clearHover()
        return
      }

      const rowEl = cellEl.closest('tr') as HTMLTableRowElement | null
      if (!rowEl) {
        clearHover()
        return
      }

      /** 用原生 rowIndex/cellIndex 避免 O(N) 的 indexOf；tableEl.rows 是 live HTMLCollection，.length 为 O(1) */
      const rowIndex = rowEl.rowIndex
      const colIndex = cellEl.cellIndex
      const rowCount = tableEl.rows.length
      const colCount = tableEl.rows[0]?.cells.length ?? 0

      /** 同单元格内的多次 mousemove 不应触发 setState，避免重复渲染 */
      setHoverInfo((prev) => {
        if (prev
          && prev.tableEl === tableEl
          && prev.rowIndex === rowIndex
          && prev.colIndex === colIndex
          && prev.rowCount === rowCount
          && prev.colCount === colCount) {
          return prev
        }
        return { tableEl, rowIndex, colIndex, cellEl, rowCount, colCount }
      })
    })
  })

  const handleMouseLeave = useLatestCallback(() => {
    clearHover()
  })

  useEffect(() => {
    if (!editor || !enabled) {
      clearHover()
      return
    }

    const editorEl = getEditorElement(editor)
    if (!editorEl)
      return

    editorEl.addEventListener('mousemove', handleMouseMove, { passive: true })
    editorEl.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      editorEl.removeEventListener('mousemove', handleMouseMove)
      editorEl.removeEventListener('mouseleave', handleMouseLeave)
      if (rafRef.current)
        cancelAnimationFrame(rafRef.current)
    }
    /** handleMouseMove/handleMouseLeave/clearHover 由 useLatestCallback 保证稳定，无需列为依赖 */
  }, [editor, enabled])

  return hoverInfo
}
