import type { Editor } from '@tiptap/react'
import type { EditorBridge } from './EditorIntegration'
import type { AIOperationMode, AIResponseFormat, NormalizedResponse, SelectionPayload } from './types'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { AI_CLASSES, AI_META } from './constants'

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
        const meta = tr.getMeta(PREVIEW_DECORATION_KEY)
        if (meta !== undefined) {
          return meta
        }
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
 */
export function createTiptapEditorBridge(editor: Editor, options?: TiptapBridgeOptions): EditorBridge {
  const { onConflict } = options || {}

  if (onConflict) {
    const handleTransaction = ({ transaction }: { transaction: any }) => {
      if (transaction.getMeta(AI_META.INTERNAL) || !transaction.docChanged)
        return

      const range = getDecorationRange()
      if (!range)
        return

      let overlapped = false
      transaction.mapping.maps.forEach((stepMap: any) => {
        stepMap.forEach((_oldStart: number, _oldEnd: number, newStart: number, newEnd: number) => {
          if (newStart < range.to && newEnd > range.from)
            overlapped = true
        })
      })

      if (overlapped)
        onConflict()
    }

    editor.on('transaction', handleTransaction)
  }

  const updateDecorations = (from: number, to: number, classes: string) => {
    if (!editor || editor.isDestroyed || from < 0 || to < 0 || from >= to)
      return

    const decoration = Decoration.inline(from, to, { class: classes })
    const decorationSet = DecorationSet.create(editor.state.doc, [decoration])
    const tr = editor.state.tr
      .setMeta(PREVIEW_DECORATION_KEY, decorationSet)
      .setMeta(AI_META.SKIP_HISTORY, false)
      .setMeta(AI_META.INTERNAL, true)

    editor.view.dispatch(tr)
  }

  const clearDecorations = () => {
    if (!editor || editor.isDestroyed)
      return
    const tr = editor.state.tr
      .setMeta(PREVIEW_DECORATION_KEY, DecorationSet.empty)
      .setMeta(AI_META.SKIP_HISTORY, false)
      .setMeta(AI_META.INTERNAL, true)
    editor.view.dispatch(tr)
  }

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
      range: { from, to, anchor: selection.anchor, head: selection.head },
      version: `${from}-${to}-${Date.now()}`,
    }
  }

  const resolveContent = (text: string, format: AIResponseFormat = 'text') => {
    if (format === 'text')
      return { content: text, options: { parseOptions: { preserveWhitespace: 'full' as const } } }
    if (format === 'markdown')
      return { content: text, options: { contentType: 'markdown' } }
    return { content: text, options: {} as any }
  }

  let originalText: string | null = null
  let isPreviewing = false
  let currentMode: AIOperationMode = 'replace'
  let savedPreviewText: string | null = null
  let savedPreviewFormat: AIResponseFormat = 'text'

  const resetState = () => {
    originalText = null
    isPreviewing = false
    currentMode = 'replace'
    savedPreviewText = null
    savedPreviewFormat = 'text'
  }

  const restoreOriginalText = () => {
    const currentRange = getDecorationRange()
    if (currentRange) {
      if (currentMode === 'insert') {
        editor
          .chain()
          .setTextSelection(currentRange)
          .deleteSelection()
          .setMeta(AI_META.SKIP_HISTORY, false)
          .setMeta(AI_META.INTERNAL, true)
          .run()
      }
      else if (originalText !== null) {
        editor
          .chain()
          .setTextSelection(currentRange)
          .deleteSelection()
          .insertContent(originalText, {
            parseOptions: { preserveWhitespace: 'full' },
          })
          .setMeta(AI_META.SKIP_HISTORY, false)
          .setMeta(AI_META.INTERNAL, true)
          .run()
      }
    }
    clearDecorations()
    resetState()
  }

  return {
    renderPreview: (preview: NormalizedResponse, selection?: SelectionPayload) => {
      const currentRange = getDecorationRange()
      const sel = selection ?? getSelectionPayload()

      if (!sel || !sel.range)
        return

      const { from: initialFrom, to: initialTo } = sel.range as { from: number, to: number }
      const previewText = preview.text || preview.delta || ''
      const isInsert = sel.operationMode === 'insert'

      let replaceFrom = initialFrom
      let replaceTo = initialTo

      if (currentRange) {
        replaceFrom = currentRange.from
        replaceTo = currentRange.to
      }

      if (!isPreviewing) {
        currentMode = isInsert
          ? 'insert'
          : 'replace'
        originalText = isInsert
          ? ''
          : editor.state.doc.textBetween(initialFrom, initialTo)
        isPreviewing = true
      }

      if (!previewText) {
        if (!isInsert && replaceFrom < replaceTo)
          updateDecorations(replaceFrom, replaceTo, AI_CLASSES.PREVIEW)
        return
      }

      savedPreviewText = previewText
      savedPreviewFormat = preview.format || 'text'

      const resolved = resolveContent(previewText, savedPreviewFormat)

      const docSizeBefore = editor.state.doc.content.size
      editor
        .chain()
        .setTextSelection({ from: replaceFrom, to: replaceTo })
        .deleteSelection()
        .insertContent(resolved.content, resolved.options)
        .setMeta(AI_META.SKIP_HISTORY, false)
        .setMeta(AI_META.INTERNAL, true)
        .run()
      const docSizeAfter = editor.state.doc.content.size

      const deletedSize = replaceTo - replaceFrom
      const insertedSize = docSizeAfter - docSizeBefore + deletedSize
      const newTo = replaceFrom + insertedSize

      if (newTo > replaceFrom)
        updateDecorations(replaceFrom, newTo, AI_CLASSES.PREVIEW)
    },

    clearPreview: restoreOriginalText,

    showProcessing: (selection?: SelectionPayload) => {
      const sel = selection ?? getSelectionPayload()
      if (!sel || !sel.range)
        return
      const { from, to } = sel.range as { from: number, to: number }
      if (from < to)
        updateDecorations(from, to, AI_CLASSES.PROCESSING)
    },

    applyPreview: (_preview: NormalizedResponse) => {
      const currentRange = getDecorationRange()
      if (!currentRange || !savedPreviewText)
        return

      clearDecorations()

      if (currentMode === 'insert') {
        editor
          .chain()
          .setTextSelection(currentRange)
          .deleteSelection()
          .setMeta(AI_META.SKIP_HISTORY, false)
          .setMeta(AI_META.INTERNAL, true)
          .run()

        const resolved = resolveContent(savedPreviewText, savedPreviewFormat)
        editor
          .chain()
          .insertContent(resolved.content, resolved.options)
          .run()
      }
      else {
        if (originalText === null)
          return

        editor
          .chain()
          .setTextSelection(currentRange)
          .deleteSelection()
          .insertContent(originalText, {
            parseOptions: { preserveWhitespace: 'full' },
          })
          .setMeta(AI_META.SKIP_HISTORY, false)
          .setMeta(AI_META.INTERNAL, true)
          .run()

        const restoredTo = currentRange.from + originalText.length

        const resolved = resolveContent(savedPreviewText, savedPreviewFormat)
        editor
          .chain()
          .setTextSelection({ from: currentRange.from, to: restoredTo })
          .deleteSelection()
          .insertContent(resolved.content, resolved.options)
          .run()
      }

      resetState()

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
      if (from < to) {
        updateDecorations(from, to, AI_CLASSES.ERROR)
        setTimeout(() => clearDecorations(), 3000)
      }
    },

    onCancel: restoreOriginalText,
  }
}

/**
 * 从 Tiptap Editor 获取当前选区并转换为 SelectionPayload（替换模式）
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
    range: { from, to, anchor: selection.anchor, head: selection.head },
    version: `${from}-${to}-${Date.now()}`,
    operationMode: 'replace',
  }
}

/**
 * 从 Tiptap Editor 获取光标位置并转换为 SelectionPayload（插入模式）
 */
export function getTiptapCursorPayload(editor: Editor | null): SelectionPayload | undefined {
  if (!editor || editor.isDestroyed)
    return undefined

  const { selection } = editor.state
  if (!selection.empty)
    return undefined

  const pos = selection.from

  return {
    text: '',
    range: { from: pos, to: pos },
    operationMode: 'insert',
    version: `cursor-${pos}-${Date.now()}`,
  }
}

export type TiptapBridgeOptions = {
  onConflict?: () => void
}
