/** 内容变更通知的上下文传递工具 */

/** 默认用户输入上下文 */
export const DEFAULT_CONTENT_CHANGE_CONTEXT: ContentChangeContext = {
  source: 'user',
  reason: 'typing',
  shouldPersist: true,
}

let activeContentChangeContext: ContentChangeContext | null = null

/** 读取当前同步调用链上的内容变更上下文 */
export function getActiveContentChangeContext(): ContentChangeContext {
  return activeContentChangeContext ?? DEFAULT_CONTENT_CHANGE_CONTEXT
}

/** 生成发给 Native 的 contentChanged 结构化载荷 */
export function createContentChangedPayload(
  content: string,
  context: ContentChangeContext,
): ContentChangedPayload {
  return {
    content,
    format: 'markdown',
    context,
  }
}

/** 在一次同步 / 异步写内容调用链上临时挂载内容变更上下文 */
export function withContentChangeContext<T>(
  context: ContentChangeContext,
  run: () => T,
): T {
  const prev = activeContentChangeContext
  activeContentChangeContext = context

  try {
    const result = run()

    if (isPromiseLike(result)) {
      return result.finally(() => {
        activeContentChangeContext = prev
      }) as T
    }

    activeContentChangeContext = prev
    return result
  }
  catch (error) {
    activeContentChangeContext = prev
    throw error
  }
}

function isPromiseLike(value: unknown): value is Promise<unknown> {
  return !!value && typeof (value as Promise<unknown>).finally === 'function'
}

/** 内容变化来源 */
export type ContentChangeSource = 'user' | 'native' | 'internal'

/** 内容变化原因 */
export type ContentChangeReason =
  | 'typing'
  | 'set-content'
  | 'set-markdown'
  | 'set-html'
  | 'set-image'
  | 'update-image'
  | 'remove-image'
  | 'ai-edit-apply'
  | 'ai-edit-stream'
  | 'ai-edit-accept'
  | 'ai-edit-reject'
  | 'unknown'

/** 内容变化上下文 */
export interface ContentChangeContext {
  /** 触发内容变化的一侧 */
  source: ContentChangeSource
  /** 触发内容变化的具体原因 */
  reason: ContentChangeReason
  /** Native 是否应该把这次变化持久化 / 转发接口 */
  shouldPersist: boolean
  /** Native 调用链路可选透传 id，用于排查或去重 */
  requestId?: string
}

/** contentChanged 事件载荷 */
export interface ContentChangedPayload {
  /** 当前 Markdown 内容 */
  content: string
  /** 内容格式 */
  format: 'markdown'
  /** 本次内容变化上下文 */
  context: ContentChangeContext
}
