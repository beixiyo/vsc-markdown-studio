/**
 * AI 相关类型定义，覆盖请求、响应、配置与适配器接口
 */
export type AIRequestMode = 'stream' | 'batch'

/**
 * 操作模式：替换选区内容 or 在光标处插入
 */
export type AIOperationMode = 'replace' | 'insert'

/**
 * 编辑器上下文，传递给 adapter 以便 LLM 获得更丰富的语境
 */
export type ContentContext = {
  /** 所属 section 的 markdown 文本 */
  sectionMarkdown?: string
  /** 所属 section 的标题信息 */
  sectionHeading?: { level: number, text: string } | null
  /** 当前 block 的节点类型 */
  blockType?: string
  /** 全文内容（由调用方决定是否填充） */
  fullDocument?: string
}

/**
 * 选区载荷，向适配器透传文本与位置信息
 */
export type SelectionPayload = {
  /** 选中文本（insert 模式下为空字符串） */
  text: string
  /** 位置信息，留给上层决定格式 */
  range?: Record<string, any>
  /** 选区版本号，用于撤销或幂等控制 */
  version?: string
  /** 透传的额外信息 */
  meta?: Record<string, any>
  /** 操作模式 @default 'replace' */
  operationMode?: AIOperationMode
  /** 编辑器上下文 */
  context?: ContentContext
}

/**
 * 标准化的 AI 错误体
 */
export type AIError = {
  /** 供应商或业务错误码 */
  code?: string
  /** 错误文案 */
  message: string
  /** 透传元信息 */
  meta?: Record<string, any>
}

/**
 * 供应商原始响应字段映射声明
 */
export type ResponseSchema = {
  /**
   * 完整文本字段名（用于非流式或流式最终汇总）
   * @default 'text'
   */
  textKey?: string
  /**
   * 流式增量字段名
   * @default 'delta'
   */
  deltaKey?: string
  /**
   * 元信息字段名
   * @default 'meta'
   */
  metaKey?: string
  /**
   * 错误字段名
   * @default 'error'
   */
  errorKey?: string
  /**
   * 内容格式字段名
   * @default 'format'
   */
  formatKey?: string
}

/** AI 响应内容的格式 */
export type AIResponseFormat = 'text' | 'markdown' | 'html'

/**
 * 经过 schema 归一化后的响应数据
 */
export type NormalizedResponse = {
  /** 流式增量，需按顺序叠加 */
  delta?: string
  /** 完整文本 */
  text?: string
  /** 供应商透传元信息 */
  meta?: Record<string, any>
  /** 标准化错误 */
  error?: AIError
  /** 内容格式 @default 'text' */
  format?: AIResponseFormat
}

/**
 * UI 行为配置，用于预览层高亮与交互文案
 */
export type UIBehaviorConfig = {
  /** 高亮 token 配置，调用方自行约定格式 */
  highlightTokens?: {
    processing?: string
    preview?: string
    rejected?: string
    error?: string
  }
  /** CTA 按钮文案 */
  ctaText?: {
    accept?: string
    reject?: string
    cancel?: string
  }
  /** 键盘快捷键映射 */
  shortcuts?: {
    accept?: string
    reject?: string
    cancel?: string
  }
  /** 加载指示样式配置 */
  loadingIndicator?: {
    /**
     * 展示类型
     * @default 'spinner'
     */
    type?: 'spinner' | 'progress' | 'wave'
    /** 进度节流毫秒 */
    throttleMs?: number
  }
  /** 是否展示流式进度提示 */
  progressHint?: boolean
}

/**
 * 重试策略配置
 */
export type RetryPolicy = {
  /** 重试次数 */
  times: number
  /** 退避毫秒 */
  backoffMs?: number
}

/**
 * 适配器上下文，便于实现取消与透传配置
 */
export type AIAdapterContext = {
  abortSignal?: AbortSignal
  uiBehavior?: UIBehaviorConfig
  mode: AIRequestMode
}

/**
 * 流式适配器接口
 */
export type StreamingAdapter = (payload: SelectionPayload, ctx: AIAdapterContext) => AsyncIterable<unknown>

/**
 * 非流式适配器接口
 */
export type BatchAdapter = (payload: SelectionPayload, ctx: AIAdapterContext) => Promise<unknown>

/**
 * 适配器组合
 */
export type AIAdapters = {
  streamingAdapter?: StreamingAdapter
  batchAdapter?: BatchAdapter
}

/**
 * AI 配置项
 */
export type AIConfig = {
  /** 适配器注册 */
  adapters: AIAdapters
  /**
   * 模式：仅预览或自动应用
   * @default 'preview'
   */
  mode?: 'preview' | 'autoApply'
  /** 重试策略 */
  retry?: RetryPolicy
  /**
   * 超时时间，毫秒；小于 0 表示不超时
   * @default -1
   */
  timeoutMs?: number
  /** 响应字段映射 */
  responseSchema?: ResponseSchema
  /** UI 行为配置 */
  uiBehavior?: UIBehaviorConfig
}
