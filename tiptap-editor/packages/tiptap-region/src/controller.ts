/**
 * 区域编辑控制器 —— 外部系统（AI / 协同 / 服务端自动化）→ 编辑器 的写入门面
 */

import type { Editor } from '@tiptap/core'
import type {
  RegionEditController,
  RegionEditOptions,
  RegionEditState,
  RegionLoadingFramePayload,
} from './types'
import { buildOperationsTransaction, RegionOpError } from './apply'
import { REGION_META } from './constants'
import { findBlock } from './hash'
import { clearAllRegionLoadingFrames, clearRegionLoadingFrame, setRegionLoadingFrame } from './loading-frame'
import { createApplyPreviewSession } from './preview'
import { readBlocks } from './read'
import { createStreamSession } from './stream'

/**
 * 创建区域编辑控制器
 *
 * 控制器负责 readBlocks、批量预览、流式写入、loading 外框以及 accept / reject 生命周期
 */
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
      const result = streamSession.begin(payload)
      setState('streaming')
      return result
    },

    pushChunk(streamId, delta) {
      streamSession.push(streamId, delta)
    },

    endStream(streamId) {
      streamSession.end(streamId)
      setState('preview')
    },

    showLoadingFrame(payload) {
      setRegionLoadingFrame(editor, {
        id: payload.id,
        range: resolveLoadingFrameRange(editor, payload),
        loading: true,
      })
    },

    hideLoadingFrame(id, options) {
      return clearRegionLoadingFrame(editor, id, options)
    },

    accept(options) {
      if (streamSession.isActive()) {
        streamSession.accept(options)
      }
      else if (applySession.isActive()) {
        applySession.accept()
        if (options?.loadingFrameId) {
          clearRegionLoadingFrame(editor, options.loadingFrameId, options)
        }
      }
      setState('idle')
    },

    reject() {
      rejectActive()
    },

    destroy() {
      rejectActive()
      clearAllRegionLoadingFrames(editor)
      editor.off('transaction', handleTransaction)
    },
  }
}

function resolveLoadingFrameRange(editor: Editor, payload: RegionLoadingFramePayload) {
  const doc = editor.state.doc

  if (payload.target === 'doc') {
    if (payload.op === 'append') {
      const pos = doc.content.size
      return { from: pos, to: pos }
    }
    if (payload.op === 'prepend') {
      return { from: 0, to: 0 }
    }
    throw new RegionOpError('INVALID_OPERATION', `target "doc" 的 loading 外框仅支持 append / prepend`)
  }

  const entry = findBlock(doc, payload.target)
  if (!entry) {
    throw new RegionOpError('TARGET_NOT_FOUND')
  }

  switch (payload.op) {
    case 'replace':
      return { from: entry.pos, to: entry.pos + entry.node.nodeSize }
    case 'insertBefore':
      return { from: entry.pos, to: entry.pos }
    case 'insertAfter': {
      const pos = entry.pos + entry.node.nodeSize
      return { from: pos, to: pos }
    }
    default:
      throw new RegionOpError('INVALID_OPERATION', `块目标的 loading 外框不支持 op "${payload.op}"`)
  }
}
