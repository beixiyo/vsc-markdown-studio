import type { Placement } from '@floating-ui/react'
import type { Editor } from '@tiptap/core'
import type { CascaderOption } from 'comps'
import type { PropsWithChildren, ReactNode } from 'react'

export type SelectToolbarProps = {
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
}
& React.PropsWithChildren<React.HTMLAttributes<HTMLElement>>

export type SelectToolbarConfig = {
  /** 撤销 */
  undo?: boolean
  /** 重做 */
  redo?: boolean
  /** 文本格式（标题、段落、列表、引用） */
  textFormat?: boolean
  /** 粗体 */
  bold?: boolean
  /** 斜体 */
  italic?: boolean
  /** 删除线 */
  strike?: boolean
  /** 行内代码 */
  code?: boolean
  /** 下划线 */
  underline?: boolean
  /** 文字颜色与高亮 */
  highlight?: boolean
  /** 链接 */
  link?: boolean
  /** 代码块 */
  codeBlock?: boolean
  /** 上角标 */
  superscript?: boolean
  /** 下角标 */
  subscript?: boolean
  /** 文本对齐 */
  textAlign?: boolean
  /** 插入图片 */
  image?: boolean
}

export type SelectToolbarContentProps = {
  /** 编辑器实例 */
  editor?: Editor | null
  /** 是否为移动端，默认 false */
  isMobile?: boolean
  /** 功能配置 */
  config?: SelectToolbarConfig
  /** 更多功能内容 */
  moreContent?: ReactNode | CascaderOption[]
} & PropsWithChildren<React.HTMLAttributes<HTMLElement>>

export type UseSelectToolbarOptions = {
  /** 编辑器实例 */
  editor: Editor | null
  /** 是否启用 */
  enabled: boolean
}

/**
 * SelectToolbar 组件的 Ref
 */
export interface SelectToolbarRef {
  /**
   * 手动关闭工具栏
   */
  close: () => void
}
