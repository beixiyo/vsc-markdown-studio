import type { BatchAdapter, StreamingAdapter } from '../types'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * 构造一个流式适配器，按 delta 序列依次推送，最后可选输出 text
 */
export function createMockStreamingAdapter(options: {
  deltas: string[]
  finalText?: string
  delayMs?: number
}): StreamingAdapter {
  const { deltas, finalText, delayMs = 0 } = options

  return async function* (_payload, ctx) {
    for (const delta of deltas) {
      if (ctx.abortSignal?.aborted)
        return
      if (delayMs > 0)
        await sleep(delayMs)
      yield { [ctx.mode === 'stream'
        ? 'delta'
        : 'text']: delta }
    }

    if (finalText) {
      if (ctx.abortSignal?.aborted)
        return
      yield { text: finalText }
    }
  }
}

/**
 * 构造一个非流式适配器，延时后返回完整文本
 */
export function createMockBatchAdapter(options: {
  text: string
  delayMs?: number
}): BatchAdapter {
  const { text, delayMs = 0 } = options

  return async (_payload, ctx) => {
    if (ctx.abortSignal?.aborted)
      return { text: '' }
    if (delayMs > 0)
      await sleep(delayMs)
    return { text }
  }
}
