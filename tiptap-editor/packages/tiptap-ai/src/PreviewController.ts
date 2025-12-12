import type { AIOrchestrator } from './AIOrchestrator'
import type { AIRequestMode, SelectionPayload } from './types'
import { initialPreviewState, previewReducer } from './PreviewStateMachine'

export type PreviewController = {
  /** 发送选区，驱动 orchestrator */
  sendSelection: (payload: SelectionPayload, mode: AIRequestMode) => Promise<void>
  /** 接受当前预览 */
  accept: () => void
  /** 拒绝当前预览 */
  reject: () => void
  /** 取消运行中请求 */
  cancel: (reason?: string) => void
  /** 读取当前状态 */
  getState: () => typeof initialPreviewState
  /** 订阅状态变更 */
  subscribe: (fn: (state: typeof initialPreviewState) => void) => () => void
  /** 销毁，解除所有订阅 */
  destroy: () => void
}

/**
 * 将 orchestrator 事件映射到预览层状态机，提供订阅接口
 */
export function createPreviewController(orchestrator: AIOrchestrator): PreviewController {
  let state = initialPreviewState
  const listeners = new Set<(s: typeof initialPreviewState) => void>()

  const notify = () => {
    listeners.forEach(fn => fn(state))
  }

  const apply = (event: Parameters<typeof previewReducer>[1]) => {
    state = previewReducer(state, event)
    notify()
  }

  const unsubscribers = [
    orchestrator.on('start', ({ payload, mode }) => apply({ type: 'start', payload, mode })),
    orchestrator.on('chunk', preview => apply({ type: 'chunk', preview })),
    orchestrator.on('done', preview => apply({ type: 'done', preview })),
    orchestrator.on('readyForDecision', ({ preview }) => apply({ type: 'readyForDecision', preview })),
    orchestrator.on('accept', ({ preview }) => apply({ type: 'accept', preview })),
    orchestrator.on('reject', ({ preview }) => apply({ type: 'reject', preview })),
    orchestrator.on('error', error => apply({ type: 'error', error })),
    orchestrator.on('cancel', () => apply({ type: 'cancel' })),
  ]

  const sendSelection = async (payload: SelectionPayload, mode: AIRequestMode) => {
    await orchestrator.sendSelection(payload, mode)
  }

  const accept = () => orchestrator.acceptPreview()
  const reject = () => orchestrator.rejectPreview()
  const cancel = (reason?: string) => orchestrator.cancel(reason)

  const subscribe = (fn: (s: typeof initialPreviewState) => void) => {
    listeners.add(fn)
    fn(state)
    return () => listeners.delete(fn)
  }

  const destroy = () => {
    listeners.clear()
    unsubscribers.forEach(off => off?.())
  }

  const getState = () => state

  return {
    sendSelection,
    accept,
    reject,
    cancel,
    getState,
    subscribe,
    destroy,
  }
}
