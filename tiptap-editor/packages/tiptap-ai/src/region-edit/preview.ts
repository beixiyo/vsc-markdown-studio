/**
 * applyOperations 的预览会话
 *
 * 预览实现：操作事务以 addToHistory: false 直接写入文档 + 装饰高亮
 * - reject：按逆序应用 inverted steps 还原（外部非冲突编辑经 Mapping 重定位）
 * - accept：先静默还原再带历史重放，使整次 AI 修改成为一条干净的 undo 记录
 * - 冲突（外部编辑与预览区域重叠）：放弃会话但不回滚文档，避免覆盖用户输入
 */

import type { Editor } from '@tiptap/core'
import type { Transaction } from '@tiptap/pm/state'
import type { Step } from '@tiptap/pm/transform'
import type { BuiltOperations } from './apply'
import { closeHistory } from '@tiptap/pm/history'
import { Mapping } from '@tiptap/pm/transform'
import { AI_META } from '../constants'
import { clearRegionDecorations, getRegionDecorationRanges, setRegionDecorations } from './decorations'

/** 预览高亮样式（与选区 AI 保持一致的视觉语言） */
export const REGION_CLASSES = {
  PREVIEW: 'bg-linear-to-r from-amber-400/20 to-emerald-500/20 border-b-2 border-amber-400/50 rounded-sm region-edit-preview',
  STREAMING: 'bg-linear-to-r from-blue-500/15 to-purple-600/15 border-b-2 border-blue-500/40 region-edit-streaming',
}

export type ApplyPreviewSession = {
  isActive: () => boolean
  begin: (built: BuiltOperations) => void
  accept: () => void
  reject: () => void
  /** 冲突时放弃会话：清除装饰但不动文档 */
  abandon: () => void
  /** 外部事务处理：累积 mapping 并检测与预览区域的重叠，返回 'conflict' 或 null */
  handleExternalTransaction: (tr: Transaction) => 'conflict' | null
}

export function createApplyPreviewSession(editor: Editor): ApplyPreviewSession {
  let forwardSteps: Step[] = []
  let invertedSteps: Step[] = []
  let externalMapping: Mapping | null = null

  const reset = () => {
    forwardSteps = []
    invertedSteps = []
    externalMapping = null
  }

  const isActive = () => invertedSteps.length > 0

  /** 静默回滚预览内容（inverted steps 逆序应用，外部编辑经 mapping 重定位） */
  const revertSilently = (): boolean => {
    if (editor.isDestroyed)
      return false

    const tr = editor.state.tr
    try {
      for (let i = invertedSteps.length - 1; i >= 0; i--) {
        const step = externalMapping
          ? invertedSteps[i].map(externalMapping)
          : invertedSteps[i]
        if (!step)
          continue
        const result = tr.maybeStep(step)
        if (result.failed)
          return false
      }
    }
    catch {
      return false
    }

    tr.setMeta(AI_META.SKIP_HISTORY, false)
      .setMeta(AI_META.INTERNAL, true)
    editor.view.dispatch(tr)
    return true
  }

  return {
    isActive,

    begin(built) {
      forwardSteps = built.tr.steps.slice()
      invertedSteps = built.tr.steps.map((step, i) => step.invert(built.tr.docs[i]))
      externalMapping = null

      built.tr
        .setMeta(AI_META.SKIP_HISTORY, false)
        .setMeta(AI_META.INTERNAL, true)
      editor.view.dispatch(built.tr)

      setRegionDecorations(editor, built.decoRanges, REGION_CLASSES.PREVIEW)
    },

    accept() {
      if (!isActive())
        return

      clearRegionDecorations(editor)

      /**
       * 无外部编辑时做「还原 → 带历史重放」，让本次 AI 修改成为一条 undo 记录；
       * 有外部编辑时降级：内容保持现状（已在文档中），仅结束会话
       */
      if (!externalMapping && revertSilently()) {
        const tr = editor.state.tr
        let ok = true
        for (const step of forwardSteps) {
          if (tr.maybeStep(step).failed) {
            ok = false
            break
          }
        }
        if (ok) {
          /** 显式关闭历史分组，让本次 AI 修改独立成一条 undo 记录，不与用户此前输入合并 */
          closeHistory(tr)
          tr.setMeta(AI_META.INTERNAL, true)
          editor.view.dispatch(tr)
        }
      }

      reset()
    },

    reject() {
      if (!isActive())
        return

      clearRegionDecorations(editor)
      revertSilently()
      reset()
    },

    abandon() {
      if (!isActive())
        return
      clearRegionDecorations(editor)
      reset()
    },

    handleExternalTransaction(tr) {
      if (!isActive() || !tr.docChanged)
        return null

      const ranges = getRegionDecorationRanges(editor)
      let overlapped = false

      tr.mapping.maps.forEach((stepMap) => {
        stepMap.forEach((_oldStart, _oldEnd, newStart, newEnd) => {
          for (const range of ranges) {
            if (newStart < range.to && newEnd > range.from)
              overlapped = true
          }
        })
      })

      if (overlapped)
        return 'conflict'

      if (!externalMapping)
        externalMapping = new Mapping()
      externalMapping.appendMapping(tr.mapping)
      return null
    },
  }
}
