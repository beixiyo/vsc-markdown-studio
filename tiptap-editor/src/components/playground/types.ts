import type { SpeakerClick, SpeakerMap } from './extensions'

/**
 * 简单编辑器的配置项
 */
export type EditorProps = {
  /**
   * 以 Markdown 文本作为初始内容
   */
  initialMarkdown?: string
  /**
   * Speaker 映射表，键为 originalLabel
   */
  speakerMap?: SpeakerMap
  /**
   * 点击 Speaker 时触发
   */
  onSpeakerClick?: SpeakerClick
}

/**
 * 编辑器内容组件的配置项（纯净版本，不包含 toolbar 等 UI）
 */
export type EditorContentProps = {
  data?: string | object
  /**
   * Speaker 映射表，键为 originalLabel
   */
  speakerMap?: SpeakerMap
  /**
   * 点击 Speaker 时触发
   */
  onSpeakerClick?: SpeakerClick
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
  /**
   * 编辑器内容更新时的回调
   */
  onUpdate?: (props: { editor: import('@tiptap/react').Editor }) => void
}
