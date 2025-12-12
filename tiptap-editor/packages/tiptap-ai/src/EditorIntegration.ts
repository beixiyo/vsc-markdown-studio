import type { PreviewController } from './PreviewController'
import type { AIOrchestrator } from './AIOrchestrator'
import type { NormalizedResponse, SelectionPayload } from './types'
import type { PreviewState } from './PreviewStateMachine'

export type EditorBridge = {
  /**
   * 渲染预览，不写入正文
   */
  renderPreview: (preview: NormalizedResponse, selection?: SelectionPayload) => void
  /**
   * 清理预览装订层
   */
  clearPreview?: (selection?: SelectionPayload) => void
  /**
   * 处理处理中态的提示（可选）
   */
  showProcessing?: (selection?: SelectionPayload) => void
  /**
   * 将预览一次性写入正文，返回可选的撤销函数
   */
  applyPreview: (preview: NormalizedResponse, selection?: SelectionPayload) => { undo?: () => void } | void
  /**
   * 错误提示
   */
  onError?: (message: string, selection?: SelectionPayload) => void
  /**
   * 取消提示
   */
  onCancel?: (selection?: SelectionPayload) => void
}

export type EventCallbacks = {
  /**
   * 选区变化时触发
   */
  onSelection?: (payload: SelectionPayload) => void
  /**
   * 预览更新时触发（chunk/done）
   */
  onPreviewUpdate?: (preview: NormalizedResponse, selection?: SelectionPayload) => void
  /**
   * 预览完成，进入决策态
   */
  onReadyForDecision?: (preview: NormalizedResponse, selection?: SelectionPayload) => void
  /**
   * 接受预览
   */
  onAccept?: (preview: NormalizedResponse, selection?: SelectionPayload) => void
  /**
   * 拒绝预览
   */
  onReject?: (preview: NormalizedResponse, selection?: SelectionPayload) => void
  /**
   * 错误发生
   */
  onError?: (error: { code?: string; message: string; meta?: Record<string, any> }, selection?: SelectionPayload) => void
  /**
   * 取消操作
   */
  onCancel?: (reason?: string, selection?: SelectionPayload) => void
}

export type EditorIntegration = {
  /**
   * 撤销最近一次写入
   */
  undoLastApply: () => void
  /**
   * 解除订阅
   */
  dispose: () => void
}

/**
 * 将预览控制器与编辑器桥接，负责预览渲染与接受/拒绝时的撤销策略
 * @param controller 预览控制器
 * @param bridge 编辑器桥接实现
 * @param orchestrator 可选，用于透传事件回调
 * @param callbacks 可选，事件回调集合
 */
export function bindEditor(
  controller: PreviewController,
  bridge: EditorBridge,
  orchestrator?: AIOrchestrator,
  callbacks?: EventCallbacks
): EditorIntegration {
  let lastSelection: SelectionPayload | undefined
  let undo: (() => void) | undefined

  // 绑定 orchestrator 事件回调
  const unsubscribes: Array<() => void> = []
  if (orchestrator && callbacks) {
    if (callbacks.onSelection) {
      unsubscribes.push(
        orchestrator.on('start', ({ payload }) => {
          callbacks.onSelection?.(payload)
        })
      )
    }
    if (callbacks.onPreviewUpdate) {
      unsubscribes.push(
        orchestrator.on('chunk', (preview) => {
          callbacks.onPreviewUpdate?.(preview, lastSelection)
        })
      )
      unsubscribes.push(
        orchestrator.on('done', (preview) => {
          callbacks.onPreviewUpdate?.(preview, lastSelection)
        })
      )
    }
    if (callbacks.onReadyForDecision) {
      unsubscribes.push(
        orchestrator.on('readyForDecision', ({ preview }) => {
          callbacks.onReadyForDecision?.(preview, lastSelection)
        })
      )
    }
    if (callbacks.onAccept) {
      unsubscribes.push(
        orchestrator.on('accept', ({ preview }) => {
          callbacks.onAccept?.(preview, lastSelection)
        })
      )
    }
    if (callbacks.onReject) {
      unsubscribes.push(
        orchestrator.on('reject', ({ preview }) => {
          callbacks.onReject?.(preview, lastSelection)
        })
      )
    }
    if (callbacks.onError) {
      unsubscribes.push(
        orchestrator.on('error', (error) => {
          callbacks.onError?.(error, lastSelection)
        })
      )
    }
    if (callbacks.onCancel) {
      unsubscribes.push(
        orchestrator.on('cancel', ({ reason }) => {
          callbacks.onCancel?.(reason, lastSelection)
        })
      )
    }
  }

  const handleState = (state: PreviewState) => {
    lastSelection = state.selection ?? lastSelection
    switch (state.status) {
      case 'processing':
        // 流式模式下，如果有预览内容，实时渲染；否则显示处理中提示
        if (state.preview && (state.preview.delta || state.preview.text)) {
          bridge.renderPreview(state.preview, lastSelection)
        }
        else {
          bridge.clearPreview?.(lastSelection)
          bridge.showProcessing?.(lastSelection)
        }
        break
      case 'preview':
        if (state.preview)
          bridge.renderPreview(state.preview, lastSelection)
        break
      case 'accepted':
        if (state.preview) {
          const result = bridge.applyPreview(state.preview, lastSelection)
          undo = result?.undo
          bridge.clearPreview?.(lastSelection)
        }
        break
      case 'rejected':
        bridge.clearPreview?.(lastSelection)
        undo = undefined
        break
      case 'error':
        bridge.clearPreview?.(lastSelection)
        undo = undefined
        if (state.error)
          bridge.onError?.(state.error.message, lastSelection)
        break
      case 'cancelled':
        bridge.clearPreview?.(lastSelection)
        undo = undefined
        bridge.onCancel?.(lastSelection)
        break
      case 'idle':
      default:
        break
    }
  }

  const unsubscribe = controller.subscribe(handleState)

  const undoLastApply = () => {
    undo?.()
    undo = undefined
  }

  const dispose = () => {
    unsubscribe()
    unsubscribes.forEach((unsub) => unsub())
    undo = undefined
  }

  return {
    undoLastApply,
    dispose,
  }
}



