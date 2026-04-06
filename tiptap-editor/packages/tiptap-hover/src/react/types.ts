import type { Placement } from '@floating-ui/react'
import type { Editor } from '@tiptap/core'
import type { HoverContent } from 'tiptap-api'
import type { HTMLAttributes, ReactNode } from 'react'

export type HoverTooltipProps = {
  /** 是否启用 tooltip */
  enabled?: boolean
  /** tooltip 内容 */
  content?: string | ReactNode
  /** 鼠标位置 */
  mousePosition?: { x: number, y: number } | null
  /** 自定义格式化函数 */
  formatContent?: (rawContent: unknown) => string | ReactNode
  /** tooltip 偏移量 */
  offsetDistance?: number
  /** tooltip 位置 */
  placement?: Placement
  /** 是否显示箭头 */
  showArrow?: boolean
  /** 自定义样式 */
  className?: string
  /** 最大宽度 */
  maxWidth?: number | string
} & Omit<HTMLAttributes<HTMLDivElement>, 'content' | 'ref'>

export type EditorHoverTooltipProps = {
  editor: Editor | null
  enabled?: boolean
  throttleDelay?: number
  disableOnDrag?: boolean
  disableOnSelection?: boolean
  formatContent?: (content: HoverContent | null) => string | ReactNode
  offsetDistance?: number
  placement?: Placement
}
