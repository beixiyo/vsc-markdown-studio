import type { AIError, AIRequestMode, NormalizedResponse, SelectionPayload } from './types'

export type PreviewStatus =
  | 'idle'
  | 'processing'
  | 'preview'
  | 'accepted'
  | 'rejected'
  | 'error'
  | 'cancelled'

export type PreviewState = {
  /** 当前状态 */
  status: PreviewStatus
  /** 最近一次预览内容 */
  preview?: NormalizedResponse
  /** 最近一次错误 */
  error?: AIError
  /** 关联的选区，便于撤销或幂等校验 */
  selection?: SelectionPayload
  /** 请求模式 */
  mode?: AIRequestMode
}

export type PreviewEvent =
  | { type: 'start'; payload: SelectionPayload; mode: AIRequestMode }
  | { type: 'chunk'; preview: NormalizedResponse }
  | { type: 'done'; preview: NormalizedResponse }
  | { type: 'readyForDecision'; preview: NormalizedResponse }
  | { type: 'accept'; preview: NormalizedResponse }
  | { type: 'reject'; preview: NormalizedResponse }
  | { type: 'error'; error: AIError }
  | { type: 'cancel'; reason?: string }
  | { type: 'reset' }

export const initialPreviewState: PreviewState = {
  status: 'idle',
}

/**
 * 预览层状态机：纯函数，便于在 UI 层或服务层使用
 */
export function previewReducer(state: PreviewState, event: PreviewEvent): PreviewState {
  switch (event.type) {
    case 'start':
      return {
        status: 'processing',
        preview: undefined,
        error: undefined,
        selection: event.payload,
        mode: event.mode,
      }
    case 'chunk':
      return {
        ...state,
        status: 'processing',
        preview: event.preview,
      }
    case 'done':
      return {
        ...state,
        status: 'preview',
        preview: event.preview,
      }
    case 'readyForDecision':
      return {
        ...state,
        status: 'preview',
        preview: event.preview,
      }
    case 'accept':
      return {
        ...state,
        status: 'accepted',
        preview: event.preview,
      }
    case 'reject':
      return {
        ...state,
        status: 'rejected',
        preview: event.preview,
      }
    case 'error':
      return {
        ...state,
        status: 'error',
        error: event.error,
      }
    case 'cancel':
      return {
        ...state,
        status: 'cancelled',
      }
    case 'reset':
      return initialPreviewState
    default:
      return state
  }
}

