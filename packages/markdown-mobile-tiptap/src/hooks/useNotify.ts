import type { Editor } from '@tiptap/core'
import { getEditorMarkdown } from 'tiptap-api'
import { notifyNative } from 'notify'
import { type RefObject, useEffect, useRef } from 'react'

function getBlockTypeString(editor: Editor | null): string {
  if (!editor?.state.selection)
    return 'paragraph'
  const { $from } = editor.state.selection
  const parent = $from.parent
  const name = parent.type.name
  if (name === 'heading') {
    const level = parent.attrs.level ?? 1
    return `h${level}`
  }
  if (name === 'paragraph')
    return 'paragraph'
  if (name === 'blockquote')
    return 'blockquote'
  if (name === 'codeBlock')
    return 'codeBlock'
  if (name === 'listItem') {
    const grandparent = $from.node(-1)
    if (grandparent?.type.name === 'orderedList')
      return 'ordered_list'
    return 'unordered_list'
  }
  if (name === 'taskItem')
    return 'check_list'
  return name || 'paragraph'
}

function useNotifyFn(editor: Editor | null) {
  const notifyBlockTypeChanged = () => {
    if (!editor)
      return
    const typeString = getBlockTypeString(editor)
    notifyNative('blockTypeChanged', typeString)
  }

  const notifyContentChanged = () => {
    if (!editor)
      return
    const markdown = getEditorMarkdown(editor) ?? ''
    notifyNative('contentChanged', markdown)
  }

  const notifyLabelClicked = (data: { blockId: string, label: string }) => {
    notifyNative('labelClicked', data)
  }

  return {
    notifyBlockTypeChanged,
    notifyContentChanged,
    notifyLabelClicked,
  }
}

/**
 * 与 packages/markdown-mobile useNotifyChnage 契约一致：
 * contentChanged、blockTypeChanged、heightChanged、speakerTapped、labelClicked
 */
export function useNotify(
  editor: Editor | null,
  editorElRef: RefObject<HTMLDivElement | null>,
) {
  const { notifyBlockTypeChanged, notifyContentChanged } = useNotifyFn(editor)
  const lastHeightRef = useRef<number>(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!editor)
      return

    const sendChange = () => {
      if (debounceRef.current)
        clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        notifyContentChanged()
        notifyBlockTypeChanged()
        debounceRef.current = null
      }, 150)
    }

    const onUpdate = () => sendChange()
    const onSelectionUpdate = () => notifyBlockTypeChanged()

    editor.on('update', onUpdate)
    editor.on('selectionUpdate', onSelectionUpdate)

    return () => {
      editor.off('update', onUpdate)
      editor.off('selectionUpdate', onSelectionUpdate)
      if (debounceRef.current)
        clearTimeout(debounceRef.current)
    }
  }, [editor, notifyBlockTypeChanged, notifyContentChanged])

  useEffect(() => {
    if (!editorElRef.current)
      return

    const ob = new ResizeObserver(() => {
      const height = editorElRef.current?.clientHeight ?? 0
      if (height !== lastHeightRef.current) {
        notifyNative('heightChanged', height)
        lastHeightRef.current = height
      }
    })
    ob.observe(editorElRef.current)

    return () => ob.disconnect()
  }, [editorElRef])
}
