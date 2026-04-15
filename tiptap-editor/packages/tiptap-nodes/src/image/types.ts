import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { Editor } from '@tiptap/react'

/**
 * 图片节点的所有可渲染属性
 * 除 src 外均可选，未设置时走默认样式
 */
export interface ImageAttrs {
  /**
   * 稳定标识，用于跨事件 / 跨调用定位同一张图
   *
   * - 插入时由调用方传入；未传则编辑器自动生成 UUID
   * - 只存在于 ProseMirror 状态，**不序列化到 HTML**（复制粘贴天然重置）
   * - 事件 payload 里只回传该 id，不再带 src，避免 base64 搬运炸桥接
   */
  id?: string | null
  /** 图片地址 */
  src: string
  /** 无障碍描述 / 加载失败兜底文本 */
  alt?: string | null
  /** hover 气泡 */
  title?: string | null

  /** 宽度，支持数字（px）、百分比、`em`、`rem` 等 CSS 长度 */
  width?: number | string | null
  /** 高度，`'1em'` 即行内等高 */
  height?: number | string | null
  /** 避免加载抖动，如 `'16/9'` */
  aspectRatio?: string | null

  /**
   * 视觉渲染模式
   * 注意：schema 固定为 inline，这里仅影响 CSS `display`
   * @default 'inline-block'
   */
  display?: 'inline' | 'inline-block' | 'block' | null
  /** block 模式下对齐 */
  align?: 'left' | 'center' | 'right' | null
  /** inline 模式下与文字的垂直对齐 */
  verticalAlign?: 'baseline' | 'middle' | 'text-bottom' | 'text-top' | 'top' | 'bottom' | null
  /** 图文环绕 */
  float?: 'none' | 'left' | 'right' | null
  /** 外边距覆盖 */
  margin?: string | null
  /** 内边距覆盖 */
  padding?: string | null

  /** 配合固定宽高使用 */
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down' | null
  /** 圆角，如 `'4px'`、`'50%'` */
  borderRadius?: string | null
  /** border 简写 */
  border?: string | null
  /** 阴影 */
  boxShadow?: string | null
  /** 透明度 0-1 */
  opacity?: number | null
  /** CSS filter，如 `'grayscale(1)'` */
  filter?: string | null
  /** 旋转角度（度） */
  rotate?: number | null
  /** 外部样式类 */
  className?: string | null
  /** 兜底内联样式对象 */
  style?: Record<string, string | number> | null

  /**
   * 原生懒加载
   * @default 'lazy'
   */
  loading?: 'lazy' | 'eager' | null
  /**
   * 解码策略
   * @default 'async'
   */
  decoding?: 'async' | 'sync' | 'auto' | null
  /** 加载中占位图 URL 或色值 */
  placeholder?: string | null
  /** 加载失败兜底图 */
  fallbackSrc?: string | null
  /** 低清先显（LQIP） */
  thumbnailSrc?: string | null
  /** 跨域策略 */
  crossOrigin?: 'anonymous' | 'use-credentials' | null
  /** referrer 策略 */
  referrerPolicy?: string | null
}

/**
 * 事件回调的统一 payload
 */
export interface ImageEventPayload<E extends Event = Event> {
  /** 当前节点 */
  node: ProseMirrorNode
  /** 节点属性快照 */
  attrs: ImageAttrs
  /** 节点在文档中的位置，可能为 undefined（节点未挂载时） */
  pos: number | undefined
  /** 触发的 DOM 事件 */
  event: E
  /** 编辑器实例 */
  editor: Editor
}

/**
 * 属性变更事件 payload
 */
export interface ImageAttrsChangePayload {
  next: ImageAttrs
  prev: ImageAttrs
  node: ProseMirrorNode
  pos: number | undefined
  editor: Editor
}

/**
 * 图片扩展的 options（通过 `.configure({...})` 注入）
 * 事件回调放在这里，不放在 attrs 里（attrs 必须可序列化）
 */
export interface ImageOptions {
  /** 透传到 `<img>` 的基础 HTML 属性 */
  HTMLAttributes: Record<string, any>

  /** 点击 */
  onClick?: (payload: ImageEventPayload<MouseEvent>) => void
  /** 双击 */
  onDoubleClick?: (payload: ImageEventPayload<MouseEvent>) => void
  /** 右键菜单 */
  onContextMenu?: (payload: ImageEventPayload<MouseEvent>) => void
  /** 鼠标进入 */
  onMouseEnter?: (payload: ImageEventPayload<MouseEvent>) => void
  /** 鼠标离开 */
  onMouseLeave?: (payload: ImageEventPayload<MouseEvent>) => void

  /** 图片加载完成 */
  onLoad?: (payload: ImageEventPayload<Event>) => void
  /** 图片加载失败 */
  onError?: (payload: ImageEventPayload<Event>) => void

  /** 节点在编辑器中被选中 */
  onSelect?: (payload: Omit<ImageEventPayload, 'event'>) => void
  /** 节点取消选中 */
  onDeselect?: (payload: Omit<ImageEventPayload, 'event'>) => void

  /** 拖拽开始 */
  onDragStart?: (payload: ImageEventPayload<DragEvent>) => void
  /** 拖拽放下 */
  onDrop?: (payload: ImageEventPayload<DragEvent>) => void

  /** 节点被删除（适合做资源清理） */
  onRemove?: (payload: Omit<ImageEventPayload, 'event'>) => void
  /** 属性变更，便于持久化 */
  onUpdateAttrs?: (payload: ImageAttrsChangePayload) => void
}
