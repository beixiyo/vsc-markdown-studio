import type { Editor } from '@tiptap/react'

export interface TableControlsProps {
  editor: Editor | null
  enabled?: boolean
  /**
   * 鼠标离开表格/按钮后，控制按钮延迟隐藏的毫秒数
   * @default 400
   */
  hideDelay?: number
}

/** 鼠标悬停在表格中检测到的行/列信息 */
export interface TableHoverInfo {
  /** 表格 DOM 元素 */
  tableEl: HTMLTableElement
  /** 悬停的行索引（-1 表示不在行上） */
  rowIndex: number
  /** 悬停的列索引（-1 表示不在列上） */
  colIndex: number
  /** 悬停的单元格 DOM */
  cellEl: HTMLTableCellElement | null
  /** 表格总行数 */
  rowCount: number
  /** 表格总列数 */
  colCount: number
}
