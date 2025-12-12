import type {
  AIAdapterContext,
  AIAdapters,
  AIConfig,
  AIError,
  AIRequestMode,
  NormalizedResponse,
  ResponseSchema,
  SelectionPayload,
} from './types'
import { EventBus } from './Eventbus'

type AIOrchestratorEvents = {
  start: {
    payload: SelectionPayload
    mode: AIRequestMode
  }
  chunk: NormalizedResponse
  done: NormalizedResponse
  error: AIError
  readyForDecision: {
    preview: NormalizedResponse
  }
  accept: {
    preview: NormalizedResponse
  }
  reject: {
    preview: NormalizedResponse
  }
  cancel: {
    reason?: string
  }
}

/**
 * AI 事件编排器，负责调用适配器并派发标准事件
 */
export class AIOrchestrator {
  private readonly bus = new EventBus<AIOrchestratorEvents>({ triggerBefore: true })

  private config: Required<Pick<AIConfig, 'adapters'>> & Omit<AIConfig, 'adapters'> = {
    adapters: { streamingAdapter: undefined, batchAdapter: undefined },
    mode: 'preview',
    timeoutMs: -1,
  }

  private schema: Required<ResponseSchema> = {
    textKey: 'text',
    deltaKey: 'delta',
    metaKey: 'meta',
    errorKey: 'error',
  }

  private abortController?: AbortController

  private latestPreview: NormalizedResponse = {}

  constructor(config: AIConfig) {
    this.updateConfig(config)
  }

  /**
   * 重新加载配置，允许覆盖 schema 和行为
   */
  updateConfig(config: AIConfig) {
    const { responseSchema, adapters, mode, timeoutMs, retry, uiBehavior } = config
    this.config.adapters = adapters
    this.config.mode = mode ?? 'preview'
    this.config.timeoutMs = typeof timeoutMs === 'number'
      ? timeoutMs
      : -1
    this.config.retry = retry
    this.config.uiBehavior = uiBehavior
    this.schema = {
      ...this.schema,
      ...responseSchema,
    }
  }

  /**
   * 派发选区请求并转换为标准事件流
   */
  async sendSelection(payload: SelectionPayload, mode: AIRequestMode) {
    const adapter = this.pickAdapter(mode)
    if (!adapter) {
      this.bus.emit('error', { message: '缺少对应模式的适配器' })
      return
    }

    this.abortRunning('new request')
    this.abortController = new AbortController()

    this.bus.emit('start', { payload, mode })

    const ctx: AIAdapterContext = {
      abortSignal: this.abortController.signal,
      uiBehavior: this.config.uiBehavior,
      mode,
    }

    try {
      if (mode === 'stream') {
        await this.runStreaming(adapter as AIAdapters['streamingAdapter'], payload, ctx)
      }
      else {
        await this.runBatch(adapter as AIAdapters['batchAdapter'], payload, ctx)
      }
    }
    catch (err) {
      const error = this.coerceError(err)
      this.bus.emit('error', error)
    }
  }

  /**
   * 取消当前请求
   */
  cancel(reason?: string) {
    this.abortRunning(reason ?? 'cancelled by user')
    this.bus.emit('cancel', { reason })
  }

  /**
   * 接受预览，交由调用方写入正文
   */
  acceptPreview() {
    this.bus.emit('accept', { preview: this.latestPreview })
  }

  /**
   * 拒绝预览，调用方负责清理装订层
   */
  rejectPreview() {
    this.bus.emit('reject', { preview: this.latestPreview })
  }

  on = this.bus.on.bind(this.bus)

  once = this.bus.once.bind(this.bus)

  off = this.bus.off.bind(this.bus)

  private async runStreaming(
    adapter: AIAdapters['streamingAdapter'],
    payload: SelectionPayload,
    ctx: AIAdapterContext,
  ) {
    if (!adapter)
      return

    const iterable = adapter(payload, ctx)
    for await (const raw of iterable) {
      if (this.abortController?.signal.aborted)
        return
      const normalized = this.normalize(raw)
      this.latestPreview = this.mergePreview(this.latestPreview, normalized)

      if (normalized.error) {
        this.bus.emit('error', normalized.error)
        return
      }

      /** 流式模式下，传递累积的预览内容，以便 UI 实时展示 */
      if (normalized.delta)
        this.bus.emit('chunk', this.latestPreview)
    }

    this.bus.emit('done', this.latestPreview)
    this.bus.emit('readyForDecision', { preview: this.latestPreview })
  }

  private async runBatch(
    adapter: AIAdapters['batchAdapter'],
    payload: SelectionPayload,
    ctx: AIAdapterContext,
  ) {
    if (!adapter)
      return

    const runner = this.wrapWithTimeout(() => adapter(payload, ctx))
    const raw = await runner()
    if (this.abortController?.signal.aborted)
      return
    const normalized = this.normalize(raw)
    this.latestPreview = this.mergePreview({}, normalized)

    if (normalized.error) {
      this.bus.emit('error', normalized.error)
      return
    }

    this.bus.emit('done', this.latestPreview)
    this.bus.emit('readyForDecision', { preview: this.latestPreview })
  }

  private pickAdapter(mode: AIRequestMode) {
    return mode === 'stream'
      ? this.config.adapters.streamingAdapter
      : this.config.adapters.batchAdapter
  }

  private normalize(raw: unknown): NormalizedResponse {
    if (!raw || typeof raw !== 'object')
      return {}

    const box = raw as Record<string, any>
    return {
      delta: box[this.schema.deltaKey],
      text: box[this.schema.textKey],
      meta: box[this.schema.metaKey],
      error: box[this.schema.errorKey],
    }
  }

  private mergePreview(origin: NormalizedResponse, incoming: NormalizedResponse): NormalizedResponse {
    const delta = incoming.delta
      ? `${origin.delta ?? ''}${incoming.delta}`
      : origin.delta

    return {
      delta,
      text: incoming.text ?? origin.text,
      meta: incoming.meta ?? origin.meta,
      error: incoming.error ?? origin.error,
    }
  }

  private wrapWithTimeout<T>(runner: () => Promise<T>) {
    if (!this.config.timeoutMs || this.config.timeoutMs < 0)
      return runner

    return async () => {
      return await Promise.race([
        runner(),
        new Promise<T>((_, reject) => {
          setTimeout(() => reject(new Error('AI 调用超时')), this.config.timeoutMs)
        }),
      ])
    }
  }

  private abortRunning(reason: string) {
    if (this.abortController && !this.abortController.signal.aborted) {
      this.abortController.abort(reason)
    }
  }

  private coerceError(err: unknown): AIError {
    if (err instanceof Error)
      return { message: err.message }

    if (typeof err === 'object' && err && 'message' in err)
      return { message: String((err as Record<string, any>).message) }

    return { message: '未知错误' }
  }
}
