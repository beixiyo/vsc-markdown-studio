import type { RefObject } from 'react'
import type { SpeakerClick, SpeakerMap } from './extensions'
import type { Editor } from '@tiptap/core'
import type { CommentStore } from 'tiptap-comment'

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
  ref?: RefObject<Editor | null>
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

/**
 * 演示用编辑器 UI 组合 props，外部可自由组装
 */
export type EditorUIProps = {
  /**
   * 是否为移动端，影响工具栏布局
   */
  isMobile: boolean
  /**
   * 视口高度，用于计算悬浮位置
   */
  height: number
  /**
   * 移动端工具栏当前视图
   */
  mobileView: 'main' | 'highlighter' | 'link'
  /**
   * 切换移动端工具栏视图
   */
  setMobileView: (view: 'main' | 'highlighter' | 'link') => void
  /**
   * 评论存储实例
   */
  commentStore: CommentStore
  /**
   * 工具栏 ref，用于遮挡处理
   */
  toolbarRef: RefObject<HTMLDivElement | null>
}
