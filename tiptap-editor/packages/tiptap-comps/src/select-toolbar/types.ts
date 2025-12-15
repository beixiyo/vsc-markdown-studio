import type { Placement } from '@floating-ui/react'
import type { Editor } from '@tiptap/core'

export interface SelectionToolbarProps {
  /**
   * 可选的编辑器实例，如果不提供则从上下文获取
   */
  editor?: Editor | null
  /**
   * 是否启用工具栏
   * @default true
   */
  enabled?: boolean
  /**
   * 工具栏内容（children 插槽）
   */
  children?: React.ReactNode
  /**
   * 工具栏偏移量（距离选中文本的距离）
   * @default 8
   */
  offsetDistance?: number
  /**
   * 工具栏位置
   * @default 'top'
   */
  placement?: Placement
  /**
   * 自定义样式类名
   */
  className?: string
  /**
   * 编辑器查询类名
   * @default .tiptap
   */
  editorSelector?: string
}
