/**
 * AI 区域编辑协议（Hash 锚点）类型定义
 *
 * 协议文档：tiptap-editor/packages/tiptap-region/README.md
 * hash 是 web 端生成的不透明令牌，外部（移动端 / 算法侧）只透传引用，不参与计算
 */

/**
 * 内容格式：markdown 为默认；
 * 需要表达 Markdown 写不出的样式（如渐变高亮）时用 html 或 json（ProseMirror JSON，无损首选）
 */
export type RegionContentFormat = 'markdown' | 'html' | 'json'

/**
 * 操作内容载荷
 */
export type RegionContent = {
  /** 内容格式 @default 'markdown' */
  format: RegionContentFormat
  /**
   * markdown / html 为内容字符串，可包含多个块；
   * json 为 ProseMirror JSON —— 单节点、节点数组或整个 doc 均可，也接受 JSON 字符串
   */
  value: string | Record<string, any> | Record<string, any>[]
}

/** 操作类型 */
export type RegionOpType =
  | 'replace'
  | 'insertBefore'
  | 'insertAfter'
  | 'delete'
  | 'searchReplace'
  | 'append'
  | 'prepend'
  | 'replaceAll'

/**
 * 单条编辑操作
 *
 * | op | target | 必填字段 |
 * |----|--------|----------|
 * | replace / insertBefore / insertAfter | 块 hash | content |
 * | delete | 块 hash | — |
 * | searchReplace | 块 hash | search、replace |
 * | append / prepend / replaceAll | "doc" | content |
 */
export type RegionOperation = {
  /** 块 hash（来自 readBlocks / newHash），或保留字 "doc" */
  target: string
  op: RegionOpType
  content?: RegionContent
  /** searchReplace：块内待匹配的唯一字符串 */
  search?: string
  /** searchReplace：替换为的字符串 */
  replace?: string
}

/**
 * readBlocks 返回的单个块
 */
export type RegionBlock = {
  /** 块锚点，重复内容按文档顺序追加 `#2` `#3` 后缀 */
  hash: string
  /** 节点类型名（paragraph / heading / bulletList ...） */
  type: string
  /** 块的 Markdown 文本 */
  markdown: string
  /** true 表示该块含 Markdown 无法无损表达的内容（如渐变高亮），此时附带 html */
  lossy?: boolean
  /** lossy 时的无损 HTML 表示 */
  html?: string
}

export type ReadBlocksResult = {
  /**
   * 协议版本号，只增不减；消费方按版本协商行为
   * @default 1
   */
  protocolVersion: number
  /** 文档事务计数，仅用于调试与日志关联 */
  docVersion: number
  blocks: RegionBlock[]
}

export type ReadBlocksOptions = {
  /**
   * 是否做 lossy 检测并为有损块附带 html（逐块 roundtrip，有一定开销）
   * @default true
   */
  detectLossy?: boolean
}

/** 协议错误码 */
export type RegionErrorCode =
  | 'TARGET_NOT_FOUND'
  | 'SEARCH_NOT_FOUND'
  | 'SEARCH_NOT_UNIQUE'
  | 'INVALID_CONTENT'
  | 'INVALID_OPERATION'
  | 'STREAM_CONFLICT'
  | 'STREAM_NOT_FOUND'

/**
 * 单条操作的执行结果
 */
export type RegionOperationResult = {
  target: string
  success: boolean
  error?: RegionErrorCode
  /**
   * 产生了新块的操作返回新块 hash，算法侧可链式继续修改而无需重新 readBlocks；
   * content 含多个块时为数组
   */
  newHash?: string | string[]
}

export type ApplyResult = {
  results: RegionOperationResult[]
}

export type ApplyOptions = {
  /**
   * true：进入预览态（装饰高亮 + accept/reject）；false：直接落盘写入
   * @default false
   */
  preview?: boolean
}

export type ApplyPayload = {
  operations: RegionOperation[]
  options?: ApplyOptions
}

/** 流式仅支持「目标 + 内容」型操作 */
export type StreamOpType = 'replace' | 'insertBefore' | 'insertAfter' | 'append' | 'prepend'

export type BeginStreamPayload = {
  /** 块 hash 或 "doc"（append / prepend 时） */
  target: string
  op: StreamOpType
  /** 流式内容的格式 @default 'markdown' */
  format?: RegionContentFormat
}

export type BeginStreamResult = {
  streamId: string
}

/** 控制器状态机 */
export type RegionEditState = 'idle' | 'streaming' | 'preview'

export type RegionEditOptions = {
  /** 状态变化回调（用于桥接层向原生上报） */
  onStateChange?: (state: RegionEditState) => void
  /** 冲突回调：预览 / 流式期间用户编辑了目标区域，session 已自动回滚 */
  onConflict?: (info: { streamId?: string }) => void
}
