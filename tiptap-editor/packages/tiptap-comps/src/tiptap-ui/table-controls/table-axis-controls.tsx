'use client'

import type { Editor } from '@tiptap/react'
import type { TableHoverInfo } from './types'
import { SafePortal } from 'comps'
import { useFloatingPosition, useLatestCallback } from 'hooks'
import { memo, useCallback, useRef } from 'react'
import { useTableLabels } from 'tiptap-api/react'

type Axis = 'row' | 'column'

interface TableAxisControlsProps {
  /** 控制轴向：row 位于行左侧（竖排），column 位于列顶部（横排） */
  axis: Axis
  editor: Editor
  hoverInfo: TableHoverInfo
  scrollContainer: HTMLElement | null
  onMouseEnter: () => void
  onMouseLeave: () => void
}

/**
 * 表格行/列悬浮控制按钮：根据 axis 显示添加/删除按钮。
 * 两个方向共享定位、渲染和命令派发逻辑，仅在具体坐标与命令名上按轴分叉。
 */
export const TableAxisControls = memo<TableAxisControlsProps>(({
  axis,
  editor,
  hoverInfo,
  scrollContainer,
  onMouseEnter,
  onMouseLeave,
}) => {
  const floatingRef = useRef<HTMLDivElement>(null)
  const { tableEl, rowIndex, colIndex, rowCount, colCount } = hoverInfo
  const tableLabels = useTableLabels()

  const isRow = axis === 'row'
  const count = isRow
    ? rowCount
    : colCount
  const addLabel = isRow
    ? tableLabels.addRow
    : tableLabels.addColumn
  const deleteLabel = isRow
    ? tableLabels.deleteRow
    : tableLabels.deleteColumn

  const getVirtualReferenceRect = useCallback(() => {
    const tableRect = tableEl.getBoundingClientRect()

    if (isRow) {
      /** 行控制：定位在行左侧边缘外，垂直居中于行 */
      const rows = tableEl.querySelectorAll('tr')
      const row = rows[rowIndex]
      if (!row)
        return null
      const rowRect = row.getBoundingClientRect()
      return new DOMRect(
        tableRect.left - 28,
        rowRect.top + rowRect.height / 2 - 10,
        0,
        0,
      )
    }

    /** 列控制：定位在列顶部边缘外，水平居中于单元格（按钮组约 42px 宽，向左偏移 21px 居中） */
    const firstRow = tableEl.querySelector('tr')
    if (!firstRow)
      return null
    const cell = firstRow.cells[colIndex]
    if (!cell)
      return null
    const cellRect = cell.getBoundingClientRect()
    return new DOMRect(
      cellRect.left + cellRect.width / 2 - 21,
      tableRect.top - 24,
      0,
      0,
    )
  }, [tableEl, isRow, rowIndex, colIndex])

  const { style: floatingStyle } = useFloatingPosition(
    { current: null },
    floatingRef,
    {
      enabled: true,
      getVirtualReferenceRect,
      placement: 'bottom-start',
      offset: 0,
      flip: false,
      shift: false,
      containerRef: { current: scrollContainer },
    },
  )

  /** 行操作目标为当前行首格，列操作目标为首行该列格，用于转换到 ProseMirror 位置 */
  const getTargetCell = (): HTMLTableCellElement | null => {
    const rows = tableEl.querySelectorAll('tr')
    if (isRow)
      return rows[rowIndex]?.cells[0] ?? null
    return rows[0]?.cells[colIndex] ?? null
  }

  /** 点击回调用 useLatestCallback 保持稳定引用，同时始终读取最新 props */
  const handleAdd = useLatestCallback(() => {
    const cell = getTargetCell()
    if (!cell)
      return
    const pos = editor.view.posAtDOM(cell, 0)
    const chain = editor.chain().focus(pos)
    if (isRow)
      chain.addRowAfter().run()
    else
      chain.addColumnAfter().run()
  })

  const handleDelete = useLatestCallback(() => {
    const cell = getTargetCell()
    if (!cell)
      return
    const pos = editor.view.posAtDOM(cell, 0)
    const chain = editor.chain().focus(pos)
    if (isRow)
      chain.deleteRow().run()
    else
      chain.deleteColumn().run()
  })

  return (
    <SafePortal target={ scrollContainer !== document.body
      ? scrollContainer ?? undefined
      : undefined }>
      <div
        ref={ floatingRef }
        className={ `z-50 flex ${isRow
          ? 'flex-col'
          : ''} items-center gap-0.5 opacity-60 hover:opacity-100 transition-opacity duration-200` }
        style={ floatingStyle }
        onMouseDown={ e => e.preventDefault() }
        onMouseEnter={ onMouseEnter }
        onMouseLeave={ onMouseLeave }
      >
        <button
          type="button"
          className="flex items-center justify-center w-5 h-5 rounded text-xs bg-brand/10 text-brand hover:bg-brand/20 transition-colors"
          onClick={ handleAdd }
          title={ addLabel }
        >
          <PlusIcon />
        </button>
        { count > 1 && (
          <button
            type="button"
            className="flex items-center justify-center w-5 h-5 rounded text-xs bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
            onClick={ handleDelete }
            title={ deleteLabel }
          >
            <MinusIcon />
          </button>
        ) }
      </div>
    </SafePortal>
  )
})

TableAxisControls.displayName = 'TableAxisControls'

function PlusIcon() {
  return <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 2.5V9.5M2.5 6H9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
}

function MinusIcon() {
  return <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.5 6H9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
}
