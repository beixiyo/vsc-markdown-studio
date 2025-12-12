import type { SelectionPayload } from '../types'
import { AIOrchestrator } from '../AIOrchestrator'
import { createPreviewController } from '../PreviewController'
import { createMockBatchAdapter, createMockStreamingAdapter } from './MockAdapters'

/**
 * 创建一个带有 mock 适配器的 orchestrator + controller 组合
 */
function createMockBundle() {
  const orchestrator = new AIOrchestrator({
    adapters: {
      streamingAdapter: createMockStreamingAdapter({
        deltas: ['Hello', ', ', 'World'],
        finalText: 'Hello, World',
        delayMs: 10,
      }),
      batchAdapter: createMockBatchAdapter({
        text: 'Batch Result',
        delayMs: 20,
      }),
    },
    mode: 'preview',
    timeoutMs: 1000,
  })

  const controller = createPreviewController(orchestrator)
  return { orchestrator, controller }
}

/**
 * 运行一次流式示例，演示 start → chunk → done → readyForDecision → accept
 */
export async function runMockStreamingDemo(payload: SelectionPayload) {
  const { controller, orchestrator } = createMockBundle()
  const unsub = controller.subscribe((state) => {
    /** 仅用于 PoC 打印 */
    // eslint-disable-next-line no-console
    console.log('[stream]', state.status, {
      delta: state.preview?.delta,
      text: state.preview?.text,
      error: state.error?.message,
    })
  })
  await controller.sendSelection(payload, 'stream')
  orchestrator.acceptPreview()
  unsub()
  controller.destroy()
}

/**
 * 运行一次非流式示例，演示 start → done → readyForDecision → reject
 */
export async function runMockBatchDemo(payload: SelectionPayload) {
  const { controller, orchestrator } = createMockBundle()
  const unsub = controller.subscribe((state) => {
    /** 仅用于 PoC 打印 */
    // eslint-disable-next-line no-console
    console.log('[batch]', state.status, {
      delta: state.preview?.delta,
      text: state.preview?.text,
      error: state.error?.message,
    })
  })
  await controller.sendSelection(payload, 'batch')
  orchestrator.rejectPreview()
  unsub()
  controller.destroy()
}
