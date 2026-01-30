import type { Editor } from '@tiptap/react'
import type { EditorBridge } from './EditorIntegration'
import type { NormalizedResponse, SelectionPayload } from './types'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { AI_CLASSES } from './constants'

const PREVIEW_DECORATION_KEY = new PluginKey('ai-preview-decoration')

/**
 * 创建预览装饰插件（需要在编辑器初始化时添加）
 */
export function createAIPreviewDecorationPlugin() {
  return new Plugin<DecorationSet>({
    key: PREVIEW_DECORATION_KEY,
    state: {
      init: () => DecorationSet.empty,
      apply: (tr, set) => {
        /** 如果事务包含预览装饰更新，使用新的装饰集 */
        const meta = tr.getMeta(PREVIEW_DECORATION_KEY)
        if (meta !== undefined) {
          return meta
        }
        /** 否则映射现有装饰，确保随文档同步移动 */
        const mapped = set.map(tr.mapping, tr.doc)
        return mapped
      },
    },
    props: {
      decorations: (state) => {
        return PREVIEW_DECORATION_KEY.getState(state)
      },
    },
  })
}

/**
 * Tiptap 编辑器桥接实现，使用 ProseMirror Decoration 实现预览装订层
 *
 * 改进：增加了坐标映射逻辑和冲突检测
 */
export function createTiptapEditorBridge(editor: Editor, options?: { onConflict?: () => void }): EditorBridge {
  const { onConflict } = options || {}

  /** 监听外部变更，如果冲突则通知 */
  if (onConflict) {
    const handleTransaction = ({ transaction }: { transaction: any }) => {
      /** 忽略 AI 内部发起的事务，以及没有文档变更的事务 */
      if (transaction.getMeta('ai-internal') || !transaction.docChanged) {
        return
      }

      const range = getDecorationRange()
      if (!range) {
        return
      }

      /** 检查变更是否与预览区域重叠 */
      let overlapped = false
      transaction.mapping.maps.forEach((stepMap: any) => {
        stepMap.forEach((_oldStart: number, _oldEnd: number, newStart: number, newEnd: number) => {
          if (newStart < range.to && newEnd > range.from) {
            overlapped = true
          }
        })
      })

      if (overlapped) {
        onConflict()
      }
    }

    editor.on('transaction', handleTransaction)
    /**
     * 注意：这里的监听器应该在 Bridge 销毁时移除，但 EditorBridge 接口目前没有 dispose 方法。
     * 考虑到 Bridge 通常随编辑器生命周期，且 editor.off 会在编辑器销毁时处理，暂时可以接受。
     */
  }
  const updateDecorations = (from: number, to: number, classes: string) => {
    if (!editor || editor.isDestroyed || from < 0 || to < 0 || from >= to)
      return

    const decoration = Decoration.inline(from, to, {
      class: classes,
    })

    const decorationSet = DecorationSet.create(editor.state.doc, [decoration])
    const tr = editor.state.tr
      .setMeta(PREVIEW_DECORATION_KEY, decorationSet)
      .setMeta('addToHistory', false)
      .setMeta('ai-internal', true) // 标记为 AI 内部事务

    editor.view.dispatch(tr)
  }

  const clearDecorations = () => {
    if (!editor || editor.isDestroyed)
      return
    const tr = editor.state.tr
      .setMeta(PREVIEW_DECORATION_KEY, DecorationSet.empty)
      .setMeta('addToHistory', false)
      .setMeta('ai-internal', true)
    editor.view.dispatch(tr)
  }

  /** 获取当前预览装饰所在的真实位置 */
  const getDecorationRange = (): { from: number, to: number } | null => {
    const set = PREVIEW_DECORATION_KEY.getState(editor.state) as DecorationSet | undefined
    if (!set || set === DecorationSet.empty)
      return null

    const deco = set.find()[0]
    if (!deco)
      return null

    return { from: deco.from, to: deco.to }
  }

  const getSelectionPayload = (): SelectionPayload | undefined => {
    if (!editor || editor.isDestroyed)
      return undefined

    const { selection } = editor.state
    if (selection.empty)
      return undefined

    const from = selection.from
    const to = selection.to
    const text = editor.state.doc.textBetween(from, to)

    return {
      text,
      range: {
        from,
        to,
        anchor: selection.anchor,
        head: selection.head,
      },
      version: `${from}-${to}-${Date.now()}`,
    }
  }

  /** 存储原始文本，用于恢复预览 */
  let originalText: string | null = null
  let isPreviewing = false

  return {
    renderPreview: (preview: NormalizedResponse, selection?: SelectionPayload) => {
      const currentRange = getDecorationRange()
      const sel = selection ?? getSelectionPayload()

      if (!sel || !sel.range)
        return

      const { from: initialFrom, to: initialTo } = sel.range as { from: number, to: number }
      const previewText = preview.text || preview.delta || ''

      /** 确定当前的替换目标范围 */
      let replaceFrom = initialFrom
      let replaceTo = initialTo

      if (currentRange) {
        replaceFrom = currentRange.from
        replaceTo = currentRange.to
      }

      /** 如果是第一次渲染预览，记录原始文本 */
      if (!isPreviewing) {
        originalText = editor.state.doc.textBetween(replaceFrom, replaceTo)
        isPreviewing = true
      }

      if (!previewText) {
        /** 仅高亮，不替换内容 */
        updateDecorations(replaceFrom, replaceTo, AI_CLASSES.PREVIEW)
        return
      }

      /** 执行替换 */
      editor
        .chain()
        .setTextSelection({ from: replaceFrom, to: replaceTo })
        .deleteSelection()
        .insertContent(previewText, {
          parseOptions: { preserveWhitespace: 'full' },
        })
        .setMeta('addToHistory', false)
        .setMeta('ai-internal', true)
        .run()

      /** 更新装饰位置 */
      const newTo = replaceFrom + previewText.length
      updateDecorations(replaceFrom, newTo, AI_CLASSES.PREVIEW)
    },

    clearPreview: () => {
      const currentRange = getDecorationRange()
      if (originalText && currentRange) {
        editor
          .chain()
          .setTextSelection(currentRange)
          .deleteSelection()
          .insertContent(originalText, {
            parseOptions: { preserveWhitespace: 'full' },
          })
          .setMeta('addToHistory', false)
          .setMeta('ai-internal', true)
          .run()
      }
      clearDecorations()
      originalText = null
      isPreviewing = false
    },

    showProcessing: (selection?: SelectionPayload) => {
      const sel = selection ?? getSelectionPayload()
      if (!sel || !sel.range)
        return
      const { from, to } = sel.range as { from: number, to: number }
      updateDecorations(from, to, AI_CLASSES.PROCESSING)
    },

    applyPreview: (_preview: NormalizedResponse) => {
      const currentRange = getDecorationRange()
      if (!currentRange || !originalText)
        return

      const previewText = editor.state.doc.textBetween(currentRange.from, currentRange.to)

      /** 清除预览装饰 */
      clearDecorations()

      /** 先静默恢复原始文本（不存历史） */
      editor
        .chain()
        .setTextSelection(currentRange)
        .deleteSelection()
        .insertContent(originalText, {
          parseOptions: { preserveWhitespace: 'full' },
        })
        .setMeta('addToHistory', false)
        .setMeta('ai-internal', true)
        .run()

      /** 重新获取恢复后的范围（通常与 originalText 长度一致） */
      const restoredTo = currentRange.from + originalText.length

      /** 正式写入预览内容（存入历史，用户可撤销） */
      editor
        .chain()
        .setTextSelection({ from: currentRange.from, to: restoredTo })
        .deleteSelection()
        .insertContent(previewText, {
          parseOptions: { preserveWhitespace: 'full' },
        })
        .run()

      /** 重置状态 */
      originalText = null
      isPreviewing = false

      return {
        undo: () => {
          if (editor.can().undo())
            editor.chain().undo().run()
        },
      }
    },

    onError: (_message: string, selection?: SelectionPayload) => {
      const sel = selection ?? getSelectionPayload()
      if (!sel || !sel.range)
        return
      const { from, to } = sel.range as { from: number, to: number }
      updateDecorations(from, to, AI_CLASSES.ERROR)
      setTimeout(() => clearDecorations(), 3000)
    },

    onCancel: () => {
      const currentRange = getDecorationRange()
      if (originalText && currentRange) {
        editor
          .chain()
          .setTextSelection(currentRange)
          .deleteSelection()
          .insertContent(originalText, {
            parseOptions: { preserveWhitespace: 'full' },
          })
          .setMeta('addToHistory', false)
          .setMeta('ai-internal', true)
          .run()
      }
      clearDecorations()
      originalText = null
      isPreviewing = false
    },
  }
}

/**
 * 从 Tiptap Editor 获取当前选区并转换为 SelectionPayload
 */
export function getTiptapSelectionPayload(editor: Editor | null): SelectionPayload | undefined {
  if (!editor || editor.isDestroyed)
    return undefined

  const { selection } = editor.state
  if (selection.empty)
    return undefined

  const from = selection.from
  const to = selection.to
  const text = editor.state.doc.textBetween(from, to)

  return {
    text,
    range: {
      from,
      to,
      anchor: selection.anchor,
      head: selection.head,
    },
    version: `${from}-${to}-${Date.now()}`,
  }
}
