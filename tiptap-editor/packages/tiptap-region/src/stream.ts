/**
 * 流式会话：beginStream / pushChunk / endStream
 *
 * 每次 flush 把累积内容整体重解析后替换当前预览范围（与选区 AI 的渲染策略一致），
 * chunk 经 rAF 合批，原生侧高频 evaluateJavascript 调用不会逐次触发重排
 */

import type { Editor } from '@tiptap/core'
import type { Node as PMNode } from '@tiptap/pm/model'
import type { Transaction } from '@tiptap/pm/state'
import type { BeginStreamPayload, RegionContentFormat } from './types'
import { rafThrottle } from '@jl-org/tool'
import { closeHistory } from '@tiptap/pm/history'
import { RegionOpError } from './apply'
import { REGION_META } from './constants'
import { parseContentToNodes } from './content'
import { clearRegionDecorations, setRegionDecorations } from './decorations'
import { findBlock } from './hash'
import { REGION_CLASSES } from './preview'

type StreamMode = 'replace' | 'insert'

type StreamState = {
  id: string
  phase: 'streaming' | 'preview'
  mode: StreamMode
  format: RegionContentFormat
  /** 当前预览内容占据的范围（insert 模式初始为折叠位置） */
  range: { from: number, to: number }
  /** replace 模式下被替换块的原始 JSON，用于还原 */
  originalJSON: Record<string, any> | null
  accumulated: string
}

export type StreamSession = {
  isActive: () => boolean
  getPhase: () => 'streaming' | 'preview' | null
  begin: (payload: BeginStreamPayload) => string
  push: (streamId: string, delta: string) => void
  end: (streamId: string) => void
  accept: () => void
  reject: () => void
  /** 冲突时放弃会话：清除装饰但不动文档 */
  abandon: () => void
  /** 外部事务处理：remap 预览范围并检测重叠，返回冲突流 id 或 null */
  handleExternalTransaction: (tr: Transaction) => string | null
}

let streamCounter = 0

export function createStreamSession(editor: Editor): StreamSession {
  let state: StreamState | null = null

  const reset = () => {
    state = null
  }

  /**
   * 把累积内容重解析并替换当前预览范围
   *
   * phase 守卫兼作迟到回调的闸门：rafThrottle 的 trailing 调用可能在
   * endStream / accept / reject 之后才触发，此时 phase 已非 streaming（或 state 已清空），直接忽略
   */
  const flush = () => {
    if (!state || state.phase !== 'streaming' || editor.isDestroyed)
      return

    if (!state.accumulated)
      return

    let nodes: PMNode[]
    try {
      nodes = parseContentToNodes(editor, { format: state.format, value: state.accumulated })
    }
    catch {
      /** 中间态解析失败（如不完整的 HTML），等待后续 chunk */
      return
    }

    const { from, to } = state.range
    const tr = editor.state.tr
      .replaceWith(from, to, nodes)
      .setMeta(REGION_META.SKIP_HISTORY, false)
      .setMeta(REGION_META.INTERNAL, true)
    editor.view.dispatch(tr)

    const newTo = from + nodes.reduce((sum, node) => sum + node.nodeSize, 0)
    state.range = { from, to: newTo }
    setRegionDecorations(editor, [state.range], REGION_CLASSES.STREAMING)
  }

  /** rAF 节流：一帧内无论收到多少 chunk 只渲染一次（非浏览器环境自动降级 ~16ms setTimeout） */
  const scheduleFlush = rafThrottle(flush)

  /** 静默还原：replace 模式恢复原块，insert 模式删除已插入内容 */
  const revertSilently = () => {
    if (!state || editor.isDestroyed)
      return

    const { from, to } = state.range
    const tr = editor.state.tr

    if (state.mode === 'replace' && state.originalJSON) {
      tr.replaceWith(from, to, editor.schema.nodeFromJSON(state.originalJSON))
    }
    else if (to > from) {
      tr.delete(from, to)
    }
    else {
      return
    }

    tr.setMeta(REGION_META.SKIP_HISTORY, false)
      .setMeta(REGION_META.INTERNAL, true)
    editor.view.dispatch(tr)
  }

  const assertStream = (streamId: string): StreamState => {
    if (!state || state.id !== streamId) {
      throw new RegionOpError('STREAM_NOT_FOUND')
    }
    return state
  }

  return {
    isActive: () => state !== null,
    getPhase: () => state?.phase ?? null,

    begin(payload) {
      const format = payload.format ?? 'markdown'
      const doc = editor.state.doc
      let mode: StreamMode
      let range: { from: number, to: number }
      let originalJSON: Record<string, any> | null = null

      if (payload.target === 'doc') {
        if (payload.op !== 'append' && payload.op !== 'prepend') {
          throw new RegionOpError('INVALID_OPERATION', `target "doc" 的流式仅支持 append / prepend`)
        }
        const pos = payload.op === 'append'
          ? doc.content.size
          : 0
        mode = 'insert'
        range = { from: pos, to: pos }
      }
      else {
        const entry = findBlock(doc, payload.target)
        if (!entry) {
          throw new RegionOpError('TARGET_NOT_FOUND')
        }

        switch (payload.op) {
          case 'replace':
            mode = 'replace'
            range = { from: entry.pos, to: entry.pos + entry.node.nodeSize }
            originalJSON = entry.node.toJSON()
            break
          case 'insertBefore':
            mode = 'insert'
            range = { from: entry.pos, to: entry.pos }
            break
          case 'insertAfter': {
            const pos = entry.pos + entry.node.nodeSize
            mode = 'insert'
            range = { from: pos, to: pos }
            break
          }
          default:
            throw new RegionOpError('INVALID_OPERATION', `块目标的流式不支持 op "${payload.op}"`)
        }
      }

      streamCounter += 1
      const next: StreamState = {
        id: `rs-${streamCounter}`,
        phase: 'streaming',
        mode,
        format,
        range,
        originalJSON,
        accumulated: '',
      }
      state = next

      /** replace 模式先把目标块标记为处理中 */
      if (mode === 'replace') {
        setRegionDecorations(editor, [range], REGION_CLASSES.STREAMING)
      }

      return next.id
    },

    push(streamId, delta) {
      const current = assertStream(streamId)
      if (current.phase !== 'streaming') {
        throw new RegionOpError('STREAM_NOT_FOUND', '流已结束，不能继续 pushChunk')
      }
      current.accumulated += delta
      scheduleFlush()
    },

    end(streamId) {
      assertStream(streamId)
      /** 同步做最终渲染，随后 phase 切换让迟到的节流回调失效 */
      flush()
      if (state) {
        state.phase = 'preview'
        setRegionDecorations(editor, [state.range], REGION_CLASSES.PREVIEW)
      }
    },

    accept() {
      if (!state)
        return

      clearRegionDecorations(editor)

      /**
       * 「还原 → 带历史重放」：让本次流式修改成为一条干净的 undo 记录
       */
      const finalValue = state.accumulated
      const { format, mode, originalJSON } = state
      const from = state.range.from

      revertSilently()

      if (finalValue) {
        try {
          const nodes = parseContentToNodes(editor, { format, value: finalValue })
          const to = mode === 'replace' && originalJSON
            ? from + editor.schema.nodeFromJSON(originalJSON).nodeSize
            : from
          const tr = editor.state.tr
            .replaceWith(from, to, nodes)
            .setMeta(REGION_META.INTERNAL, true)
          /** 显式关闭历史分组，让本次流式修改独立成一条 undo 记录 */
          closeHistory(tr)
          editor.view.dispatch(tr)
        }
        catch {
          /** 重放失败极罕见（内容已在预览中渲染过），保持还原后的状态 */
        }
      }

      reset()
    },

    reject() {
      if (!state)
        return
      clearRegionDecorations(editor)
      revertSilently()
      reset()
    },

    abandon() {
      if (!state)
        return
      clearRegionDecorations(editor)
      reset()
    },

    handleExternalTransaction(tr) {
      if (!state || !tr.docChanged)
        return null

      const { from, to } = state.range
      let overlapped = false

      tr.mapping.maps.forEach((stepMap) => {
        stepMap.forEach((_oldStart, _oldEnd, newStart, newEnd) => {
          if (newStart < to && newEnd > from)
            overlapped = true
        })
      })

      if (overlapped) {
        return state.id
      }

      state.range = {
        from: tr.mapping.map(from, 1),
        to: tr.mapping.map(to, -1),
      }
      return null
    },
  }
}
