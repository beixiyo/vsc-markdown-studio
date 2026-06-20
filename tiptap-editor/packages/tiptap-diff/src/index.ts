/**
 * 块级 id-diff 同步：编辑器 → 后端增量上报
 *
 * - `BlockId`：给每个顶层块挂稳定 id 的扩展（必须注册）
 * - `computeBlockDiff`：纯函数，对比当前文档与上次快照产出增量
 * - `createBlockSync`：控制器，订阅变更 + 防抖 + 版本管理 + resync 兜底
 *
 * 协议见类型定义；React 集成见 `tiptap-api/react` 的 `useBlockSync`
 */

export { BlockId, DEFAULT_BLOCK_ID_TYPES } from './block-id'
export type { BlockIdOptions } from './block-id'

export { createBlockSync } from './controller'
export type { BlockSyncController, BlockSyncOptions } from './controller'

export {
  buildBlockContent,
  buildSyncIndex,
  computeBlockDiff,
  computeChecksum,
  emptySnapshot,
} from './diff'
export type { BuildDiffOptions, SyncIndexEntry } from './diff'

export { randomId } from './id'

export { BLOCK_SYNC_PROTOCOL_VERSION } from './types'
export type {
  BlockDiffResult,
  BlockSnapshot,
  BlockSyncPayload,
  BlockSyncResult,
  SyncContent,
  SyncContentFormat,
  SyncDeleteOp,
  SyncOp,
  SyncUpsertOp,
} from './types'
