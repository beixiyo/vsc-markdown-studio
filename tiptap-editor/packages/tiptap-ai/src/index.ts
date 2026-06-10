import './index.css'

export { AIOrchestrator } from './AIOrchestrator'
export { ConversationHistory } from './ConversationHistory'
export type { ConversationHistoryOptions, ConversationRound } from './ConversationHistory'
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
  createRegionEdit,
  fnv1a64,
  hashBlock,
  REGION_CLASSES,
  RegionEdit,
  RegionOpError,
} from './region-edit'
export type {
  ApplyOptions,
  ApplyPayload,
  ApplyResult,
  BeginStreamPayload,
  BeginStreamResult,
  ReadBlocksOptions,
  ReadBlocksResult,
  RegionBlock,
  RegionContent,
  RegionContentFormat,
  RegionEditController,
  RegionEditOptions,
  RegionEditState,
  RegionErrorCode,
  RegionOperation,
  RegionOperationResult,
  RegionOpType,
  StreamOpType,
} from './region-edit'
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
  ConversationMessage,
  NormalizedResponse,
  SelectionPayload,
} from './types'
