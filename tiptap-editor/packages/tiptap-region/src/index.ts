/**
 * 区域编辑（Hash 锚点协议）门面 —— 外部系统（AI / 协同 / 服务端自动化）→ 编辑器 的写入通道
 *
 * 与 `tiptap-diff`（编辑器 → 后端，稳定 id 增量上报）互为反向，二者共享 `tiptap-utils` 的块序列化/hash 基元。
 *
 * 协议文档：tiptap-editor/packages/tiptap-region/README.md
 *
 * 用法：
 * ```ts
 * const regionEdit = createRegionEdit(editor, { onConflict: ... })
 * const { blocks } = regionEdit.readBlocks()
 * regionEdit.applyOperations({ operations: [...], options: { preview: true } })
 * regionEdit.accept()
 * ```
 * 编辑器需注册 `RegionEdit` 扩展（装饰插件）与 `@tiptap/markdown`
 */

import type { Editor } from '@tiptap/core'
import type {
  ApplyPayload,
  ApplyResult,
  BeginStreamPayload,
  BeginStreamResult,
  ReadBlocksOptions,
  ReadBlocksResult,
  RegionEditOptions,
  RegionEditState,
} from './types'
import { buildOperationsTransaction } from './apply'
import { REGION_META } from './constants'
import { createApplyPreviewSession } from './preview'
import { readBlocks } from './read'
import { createStreamSession } from './stream'

export type RegionEditController = {
  getState: () => RegionEditState
  getDocVersion: () => number
  readBlocks: (options?: ReadBlocksOptions) => ReadBlocksResult
  applyOperations: (payload: ApplyPayload) => ApplyResult
  beginStream: (payload: BeginStreamPayload) => BeginStreamResult
  pushChunk: (streamId: string, delta: string) => void
  endStream: (streamId: string) => void
  accept: () => void
  reject: () => void
  destroy: () => void
}

export function createRegionEdit(editor: Editor, options?: RegionEditOptions): RegionEditController {
  let state: RegionEditState = 'idle'
  let docVersion = 0

  const applySession = createApplyPreviewSession(editor)
  const streamSession = createStreamSession(editor)

  const setState = (next: RegionEditState) => {
    if (next === state)
      return
    state = next
    options?.onStateChange?.(next)
  }

  /** 开启新会话前回滚未决的旧会话，保证单会话语义 */
  const rejectActive = () => {
    if (streamSession.isActive()) {
      streamSession.reject()
    }
    if (applySession.isActive()) {
      applySession.reject()
    }
    setState('idle')
  }

  const handleTransaction = ({ transaction }: { transaction: any }) => {
    if (transaction.docChanged) {
      docVersion += 1
    }
    if (transaction.getMeta(REGION_META.INTERNAL) || !transaction.docChanged) {
      return
    }

    if (streamSession.isActive()) {
      const conflictStreamId = streamSession.handleExternalTransaction(transaction)
      if (conflictStreamId) {
        streamSession.abandon()
        setState('idle')
        options?.onConflict?.({ streamId: conflictStreamId })
      }
      return
    }

    if (applySession.isActive()) {
      if (applySession.handleExternalTransaction(transaction) === 'conflict') {
        applySession.abandon()
        setState('idle')
        options?.onConflict?.({})
      }
    }
  }

  editor.on('transaction', handleTransaction)

  return {
    getState: () => state,
    getDocVersion: () => docVersion,

    readBlocks: opts => readBlocks(editor, docVersion, opts),

    applyOperations(payload) {
      rejectActive()

      const built = buildOperationsTransaction(editor, payload.operations)
      if (!built.tr.docChanged) {
        return { results: built.results }
      }

      if (payload.options?.preview) {
        applySession.begin(built)
        setState('preview')
      }
      else {
        built.tr.setMeta(REGION_META.INTERNAL, true)
        editor.view.dispatch(built.tr)
      }

      return { results: built.results }
    },

    beginStream(payload) {
      rejectActive()
      const streamId = streamSession.begin(payload)
      setState('streaming')
      return { streamId }
    },

    pushChunk(streamId, delta) {
      streamSession.push(streamId, delta)
    },

    endStream(streamId) {
      streamSession.end(streamId)
      setState('preview')
    },

    accept() {
      if (streamSession.isActive()) {
        streamSession.accept()
      }
      else if (applySession.isActive()) {
        applySession.accept()
      }
      setState('idle')
    },

    reject() {
      rejectActive()
    },

    destroy() {
      rejectActive()
      editor.off('transaction', handleTransaction)
    },
  }
}

export { RegionOpError } from './apply'
export { RegionEdit } from './extension'
export { REGION_CLASSES } from './preview'
export { REGION_EDIT_PROTOCOL_VERSION } from './read'
export type * from './types'
