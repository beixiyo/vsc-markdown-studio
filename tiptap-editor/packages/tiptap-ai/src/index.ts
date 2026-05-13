import './index.css'

export { AIOrchestrator } from './AIOrchestrator'
export { bindEditor } from './EditorIntegration'
export type { EditorBridge, EventCallbacks } from './EditorIntegration'
export {
  createMockBatchAdapter,
  createMockInsertAdapter,
  createMockStreamingAdapter,
} from './examples/MockAdapters'
export { AI } from './extension'
export { createPreviewController } from './PreviewController'
export {
  createTiptapEditorBridge,
  getTiptapCursorPayload,
  getTiptapSelectionPayload,
} from './TiptapEditorBridge'
export type {
  AIConfig,
  AIOperationMode,
  AIResponseFormat,
  ContentContext,
  NormalizedResponse,
  SelectionPayload,
} from './types'
