import type { Editor } from '@tiptap/core'
import type { FloatingPlacement } from 'hooks'
import type { HTMLAttributes, ReactNode } from 'react'
import type { HoverContent } from 'tiptap-api'

type HoverTooltipDomProps = Omit<HTMLAttributes<HTMLDivElement>, 'content' | 'ref'>

type HoverTooltipShared = HoverTooltipDomProps & {
  enabled?: boolean
  offsetDistance?: number
  placement?: FloatingPlacement
  showArrow?: boolean
  className?: string
  maxWidth?: number | string
}

/**
 * 绑定 Tiptap：内部监听 `editor` DOM 指针并填充内容与坐标
 */
export type HoverTooltipEditorModeProps = HoverTooltipShared & {
  editor: Editor | null
  throttleDelay?: number
  disableOnDrag?: boolean
  disableOnSelection?: boolean
  formatContent?: (content: HoverContent | null) => string | ReactNode
  content?: never
  mousePosition?: never
}

/**
 * 自由模式：由外部传入 `content` 与 `mousePosition`
 */
export type HoverTooltipFreeModeProps = HoverTooltipShared & {
  editor?: never
  content?: string | ReactNode
  mousePosition?: { x: number, y: number } | null
  formatContent?: (rawContent: unknown) => string | ReactNode
  throttleDelay?: never
  disableOnDrag?: never
  disableOnSelection?: never
}

export type HoverTooltipProps = HoverTooltipEditorModeProps | HoverTooltipFreeModeProps

/** 与带 `editor` 的 `HoverTooltipProps` 相同；保留别名以兼容旧 import */
export type EditorHoverTooltipProps = HoverTooltipEditorModeProps
