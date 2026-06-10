/** 引用资源类型（与算法侧 V2 marker 词表一致） */
export type CtxRefType = 'mark' | 'note' | 'image'

/**
 * ctx-ref 节点属性
 *
 * 对应 Markdown 中的 `<!--ctx-ref:{type}:{id}-->` marker
 */
export type CtxRefAttributes = {
  /** 引用资源类型 */
  refType: CtxRefType
  /** 稳定资源 ID（mark_id / note_id / image_id），不可从顺序或时间戳推导 */
  refId: string
}

/** Note / Image 图标点击回调载荷 */
export type CtxRefClickPayload = CtxRefAttributes & {
  /**
   * marker 前紧邻的加粗斜体句（summary 中与该引用对应的一句话）
   *
   * Note 点击详情需要展示它；取不到时为空字符串
   */
  sentence: string
}

/** ctx-ref 扩展配置 */
export type CtxRefOptions = {
  /**
   * Note / Image 图标点击回调（mark 图标无交互，不会触发）
   * @default undefined
   */
  onClick?: (payload: CtxRefClickPayload, event: MouseEvent) => void
  /**
   * 追加到图标元素上的自定义类名
   * @default undefined
   */
  className?: string
}

/**
 * 会后图片区块边界属性
 *
 * 对应 `<!--summary-added-images:start-->` / `<!--summary-added-images:end-->` 哨兵
 */
export type SummaryBoundaryAttributes = {
  /** 边界类型 */
  kind: 'start' | 'end'
}
