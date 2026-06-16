import type { Editor } from '@tiptap/core'

/** 引用资源类型（marker 词表） */
export type CtxRefType = 'mark' | 'note' | 'image'

/**
 * ctx-ref 节点属性
 *
 * 对应 Markdown 中的 `<!--ctx-ref:{type}:{id}-->` marker
 */
export type CtxRefAttributes = {
  /** 引用资源类型 */
  refType: CtxRefType
  /** 稳定资源 ID，不可从顺序或时间戳推导 */
  refId: string
}

/** 图标点击回调载荷 */
export type CtxRefClickPayload = CtxRefAttributes & {
  /**
   * marker 前紧邻的加粗斜体句（与该引用对应的一句话）
   *
   * 取不到时为空字符串
   */
  sentence: string
}

/**
 * 图标工厂的上下文入参
 *
 * 工厂按 refType / refId / streaming 自行决定渲染什么 DOM，
 * 由此实现「外部完全掌控图标外观（旗帜 / 图片 icon / 流式动效……）」
 */
export type CtxRefIconContext = CtxRefAttributes & {
  /**
   * 是否处于流式替换态（图标应渲染为动效，如书写动画 / 三点循环）
   *
   * 由外部通过 `setCtxRefStreaming` 命令切换；非流式态为 `false`
   */
  streaming: boolean
  /** 当前编辑器实例 */
  editor: Editor
  /** 取节点在文档中的位置（取不到时返回 `undefined`） */
  getPos: () => number | undefined
  /**
   * 当前类型 / 状态（含 streaming）的内置默认图标元素
   *
   * 用于在内置图标上「二次加工」：包一层 DOM、加 class / 内联样式、绑事件等，
   * 而不必从头画 SVG。该类型无内置图标时返回 `null`
   *
   * @example
   * note: (ctx) => {
   *   const wrap = document.createElement('span')
   *   wrap.className = 'my-badge'
   *   const icon = ctx.defaultIcon()
   *   if (icon) wrap.appendChild(icon)
   *   return wrap
   * }
   */
  defaultIcon: () => HTMLElement | null
}

/**
 * 单个 refType 的图标工厂
 *
 * 返回挂载到锚点 `span` 内的元素（建议 `display: inline-block`）；
 * 返回 `null` / `undefined` 则该节点不渲染图标（保持零宽不可见，向后兼容）
 */
export type CtxRefIconRenderer = (ctx: CtxRefIconContext) => HTMLElement | null | undefined

/** ctx-ref 扩展配置 */
export type CtxRefOptions = {
  /**
   * 图标点击回调（mark / note / image 三类均触发）
   *
   * 载荷带 `refType`，调用方据此区分点击的是哪类引用并自行决定行为
   * @default undefined
   */
  onClick?: (payload: CtxRefClickPayload, event: MouseEvent) => void
  /**
   * 追加到图标元素上的自定义类名
   * @default undefined
   */
  className?: string
  /**
   * 按 refType 覆盖图标渲染。每个类型三种取值：
   * - 不传 / `undefined` → 用内置默认图标（开箱即用）
   * - 工厂函数 → 自定义图标（接收 `streaming` 标志，可返回静态图标或流式动效；
   *   `streaming` 变化时 NodeView 会重新调用工厂刷新）
   * - `false` / `null` → 该类型不渲染图标（保持零宽不可见）
   * @default undefined
   */
  icons?: Partial<Record<CtxRefType, CtxRefIconRenderer | false | null>>
}
