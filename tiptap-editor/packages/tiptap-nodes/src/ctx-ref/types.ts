/**
 * 引用资源类型（marker 词表）
 *
 * 词表**开放**：未知类型（后端新增的任意 type）同样解析为 ctxRef 节点——
 * 不可见、可选交互、序列化原样还原。这条是安全底线，理由见 extension.ts 与 README：
 * 若放行给 @tiptap/markdown 的通用 HTML 解析，行内 comment 会被解析成
 * 「嵌在 inline 内容里的空 paragraph」，产出非法 doc，后续触及该段落的任何
 * transaction 都会抛 RangeError
 */
export type KnownCtxRefType = 'mark' | 'note'
export type CtxRefType = KnownCtxRefType | (string & {})

/**
 * ctx-ref 节点属性，对应 markdown 中的 `<!--ctx-ref:{type}:{id}-->`
 */
export type CtxRefAttributes = {
  /** 引用资源类型 */
  refType: CtxRefType
  /** 稳定资源 ID（不可从顺序或时间戳推导） */
  refId: string
}

/** 点击回调载荷 */
export type CtxRefClickPayload = CtxRefAttributes & {
  /**
   * marker 前紧邻的加粗斜体句（约定：与该引用对应的一句话以 `***...***` 紧邻 marker 之前）
   * 取不到时为空字符串
   */
  sentence: string
}

/** ctx-ref 扩展配置（示例版最小集） */
export type CtxRefOptions = {
  /**
   * 点击锚点的回调（如定位到对应的 mark / note 资源）；不传则锚点不可点
   * @default undefined
   */
  onClick?: (payload: CtxRefClickPayload, event: MouseEvent) => void
  /**
   * 追加到锚点元素上的自定义类名
   * @default undefined
   */
  className?: string
}
