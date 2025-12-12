import type { Editor } from '@tiptap/react'
import type { EditorBridge } from './EditorIntegration'
import type { NormalizedResponse, SelectionPayload } from './types'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

const PREVIEW_DECORATION_KEY = new PluginKey('ai-preview-decoration')
const PREVIEW_DECORATION_CLASSES = 'bg-gradient-to-r from-amber-400/20 to-emerald-500/20 border-b-2 border-amber-400/50 rounded-sm'
const PROCESSING_DECORATION_CLASSES = 'bg-gradient-to-r from-blue-500/15 to-purple-600/15 border-b-2 border-blue-500/40 animate-pulse'
const ERROR_DECORATION_CLASSES = 'bg-red-500/15 border-b-2 border-red-500/50 rounded-sm'

/**
 * 创建预览装饰插件（需要在编辑器初始化时添加）
 * @example
 * ```ts
 * const editor = useEditor({
 *   extensions: [
 *     // ... other extensions
 *     createAIPreviewDecorationPlugin(),
 *   ]
 * })
 * ```
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
        /** 否则映射现有装饰 */
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
 * 注意：使用前需要在编辑器初始化时添加 `createAIPreviewDecorationPlugin()`
 */
export function createTiptapEditorBridge(editor: Editor): EditorBridge {
  const updateDecorations = (from: number, to: number, classes: string) => {
    if (!editor || editor.isDestroyed || from < 0 || to < 0 || from >= to)
      return

    const decoration = Decoration.inline(from, to, {
      class: classes,
    })

    const decorationSet = DecorationSet.create(editor.state.doc, [decoration])
    const tr = editor.state.tr.setMeta(PREVIEW_DECORATION_KEY, decorationSet).setMeta('addToHistory', false)
    editor.view.dispatch(tr)
  }

  const clearDecorations = () => {
    if (!editor || editor.isDestroyed)
      return
    const tr = editor.state.tr.setMeta(PREVIEW_DECORATION_KEY, DecorationSet.empty).setMeta('addToHistory', false)
    editor.view.dispatch(tr)
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

  /** 存储原始文本和范围，用于恢复预览 */
  let originalText: string | null = null
  let originalRange: { from: number, to: number } | null = null
  let previewRange: { from: number, to: number } | null = null

  return {
    renderPreview: (preview: NormalizedResponse, selection?: SelectionPayload) => {
      const sel = selection ?? getSelectionPayload()
      if (!sel || !sel.range)
        return

      const { from, to } = sel.range as { from: number, to: number }
      if (from < 0 || to < 0 || from >= to)
        return

      const previewText = preview.text || preview.delta || ''
      if (!previewText) {
        /** 如果没有预览文本，只显示高亮 */
        updateDecorations(from, to, PREVIEW_DECORATION_CLASSES)
        return
      }

      /** 如果当前范围与原始范围不同，说明是新的预览请求，需要保存新的原始文本 */
      const isNewPreview = !originalRange || originalRange.from !== from || originalRange.to !== to

      if (isNewPreview) {
        /** 如果有之前的预览内容，先恢复原始文本 */
        if (originalText && previewRange) {
          const { from: prevFrom, to: prevTo } = previewRange
          editor
            .chain()
            .setTextSelection({ from: prevFrom, to: prevTo })
            .deleteSelection()
            .insertContent(originalText, {
              parseOptions: {
                preserveWhitespace: 'full',
              },
            })
            .setMeta('addToHistory', false)
            .run()
        }
        /** 保存新的原始文本和范围 */
        originalText = editor.state.doc.textBetween(from, to)
        originalRange = { from, to }
      }

      /** 确定要替换的范围：如果有预览内容，先恢复原始文本，然后使用 originalRange；否则使用 selection 的 range */
      let replaceFrom = from
      let replaceTo = to

      /** 如果有预览内容，先恢复原始文本 */
      if (previewRange && !isNewPreview && originalText && originalRange) {
        /** 先恢复原始文本（从 previewRange 恢复到 originalRange） */
        const { from: prevFrom, to: prevTo } = previewRange
        editor
          .chain()
          .setTextSelection({ from: prevFrom, to: prevTo })
          .deleteSelection()
          .insertContent(originalText, {
            parseOptions: {
              preserveWhitespace: 'full',
            },
          })
          .setMeta('addToHistory', false)
          .run()
        /** 恢复后，使用 originalRange 来替换新预览 */
        replaceFrom = originalRange.from
        replaceTo = originalRange.to
      }

      /** 临时替换为预览内容（不写入历史） */
      editor
        .chain()
        .setTextSelection({ from: replaceFrom, to: replaceTo })
        .deleteSelection()
        .insertContent(previewText, {
          parseOptions: {
            preserveWhitespace: 'full',
          },
        })
        .setMeta('addToHistory', false)
        .run()

      /** 获取新的范围（因为内容长度可能变化） */
      const newTo = replaceFrom + previewText.length
      previewRange = { from: replaceFrom, to: newTo }

      /** 添加预览装饰 */
      updateDecorations(replaceFrom, newTo, PREVIEW_DECORATION_CLASSES)
    },

    clearPreview: (_selection?: SelectionPayload) => {
      /** 如果有预览内容，恢复原始文本 */
      if (originalText && previewRange && originalRange) {
        const { from, to } = previewRange
        editor
          .chain()
          .setTextSelection({ from, to })
          .deleteSelection()
          .insertContent(originalText, {
            parseOptions: {
              preserveWhitespace: 'full',
            },
          })
          .setMeta('addToHistory', false)
          .run()
      }
      clearDecorations()
      originalText = null
      originalRange = null
      previewRange = null
    },

    showProcessing: (selection?: SelectionPayload) => {
      const sel = selection ?? getSelectionPayload()
      if (!sel || !sel.range)
        return

      const { from, to } = sel.range as { from: number, to: number }
      if (from < 0 || to < 0 || from >= to)
        return

      /** 处理中态：蓝紫色高亮 */
      updateDecorations(from, to, PROCESSING_DECORATION_CLASSES)
    },

    applyPreview: (preview: NormalizedResponse, selection?: SelectionPayload) => {
      /** 如果已经有预览内容显示，需要重新执行替换操作以写入历史 */
      if (previewRange && originalText && originalRange) {
        const { from, to } = previewRange
        const previewText = editor.state.doc.textBetween(from, to)

        /** 清除装饰 */
        clearDecorations()

        /** 先恢复原始文本（不写入历史） */
        editor
          .chain()
          .setTextSelection({ from, to })
          .deleteSelection()
          .insertContent(originalText, {
            parseOptions: {
              preserveWhitespace: 'full',
            },
          })
          .setMeta('addToHistory', false)
          .run()

        /** 再替换为预览内容（写入历史） */
        const restoredTo = from + originalText.length
        editor
          .chain()
          .setTextSelection({ from, to: restoredTo })
          .deleteSelection()
          .insertContent(previewText, {
            parseOptions: {
              preserveWhitespace: 'full',
            },
          })
          .focus()
          .run()

        /** 重置预览状态 */
        originalText = null
        originalRange = null
        previewRange = null

        /** 返回撤销函数 */
        return {
          undo: () => {
            if (editor && !editor.isDestroyed) {
              /** 使用 tiptap 的撤销能力（需要 History extension） */
              if (editor.can().undo()) {
                editor.chain().undo().run()
              }
            }
          },
        }
      }

      /** 如果没有预览内容，使用原始逻辑 */
      const sel = selection ?? getSelectionPayload()
      if (!sel || !sel.range)
        return

      const { from, to } = sel.range as { from: number, to: number }
      if (!editor || editor.isDestroyed || from < 0 || to < 0 || from >= to)
        return

      const previewText = preview.text || preview.delta || ''
      if (!previewText)
        return

      /** 一次性写入正文 */
      editor
        .chain()
        .focus()
        .setTextSelection({ from, to })
        .deleteSelection()
        .insertContent(previewText)
        .run()

      /** 返回撤销函数 */
      return {
        undo: () => {
          if (editor && !editor.isDestroyed) {
            /** 使用 tiptap 的撤销能力（需要 History extension） */
            if (editor.can().undo()) {
              editor.chain().undo().run()
            }
          }
        },
      }
    },

    onError: (_message: string, selection?: SelectionPayload) => {
      const sel = selection ?? getSelectionPayload()
      if (!sel || !sel.range)
        return

      const { from, to } = sel.range as { from: number, to: number }
      if (from < 0 || to < 0 || from >= to)
        return

      /** 错误态：红色高亮 */
      updateDecorations(from, to, ERROR_DECORATION_CLASSES)
      // 3秒后自动清除
      setTimeout(() => {
        clearDecorations()
      }, 3000)
    },

    onCancel: () => {
      /** 清除预览并恢复原始文本 */
      if (originalText && previewRange && originalRange) {
        const { from, to } = previewRange
        editor
          .chain()
          .setTextSelection({ from, to })
          .deleteSelection()
          .insertContent(originalText, {
            parseOptions: {
              preserveWhitespace: 'full',
            },
          })
          .setMeta('addToHistory', false)
          .run()
      }
      clearDecorations()
      originalText = null
      originalRange = null
      previewRange = null
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
