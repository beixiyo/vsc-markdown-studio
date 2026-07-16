import type { Editor } from '@tiptap/core'

/**
 * 简单编辑器的配置项
 */
export type EditorProps = {
  /**
   * 以 Markdown 文本作为初始内容
   */
  initialMarkdown?: string
}

/**
 * 编辑器内容组件的配置项（纯净版本，不包含 toolbar 等 UI）
 */
export type EditorContentProps = {
  editor: Editor | null
  /**
   * 子元素内容（用于传入 Toolbar、SelectionToolbar 等 UI 组件）
   */
  children?: React.ReactNode
  /**
   * 自定义 className
   */
  className?: string
  /**
   * 自定义 style
   */
  style?: React.CSSProperties
}
