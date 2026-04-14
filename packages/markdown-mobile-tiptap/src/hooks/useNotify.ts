import type { Editor } from '@tiptap/core'
import { debounce } from '@jl-org/tool'
import { notifyNative } from 'notify'
import { type RefObject, useEffect, useRef } from 'react'
import { resolveBlockTypeString } from '../operate/create'

/**
 * 订阅编辑器变化并广播给 Native
 * - `contentChanged`：防抖发送 markdown
 * - `blockTypeChanged`：选区所在块类型变化
 * - `heightChanged`：容器高度变化
 */
export function useNotifyChange(
  editor: Editor | null,
  editorElRef: RefObject<HTMLDivElement | null>,
) {
  useEffect(() => {
    if (!editor)
      return

    const sendChange = debounce(() => {
      const storage = (editor.storage as any)?.markdown
      const markdown: string = storage?.getMarkdown?.() ?? editor.getHTML()
      const cleaned = markdown.replace(/!\[[^\]]*\]\(https?:\/\/\S{1,999}\)/g, '')
      notifyNative('contentChanged', cleaned)
      notifyNative('blockTypeChanged', resolveBlockTypeString(editor))
    })

    editor.on('update', sendChange)
    return () => {
      editor.off('update', sendChange)
    }
  }, [editor])

  useEffect(() => {
    if (!editor)
      return

    const onSelection = () => {
      notifyNative('blockTypeChanged', resolveBlockTypeString(editor))
    }
    editor.on('selectionUpdate', onSelection)
    return () => {
      editor.off('selectionUpdate', onSelection)
    }
  }, [editor])

  /** 高度变化 */
  const lastHeightRef = useRef<number>(0)
  useEffect(() => {
    const el = editorElRef.current
    if (!el)
      return

    const ob = new ResizeObserver(() => {
      const h = el.clientHeight ?? 0
      if (h !== lastHeightRef.current) {
        notifyNative('heightChanged', h)
        lastHeightRef.current = h
      }
    })
    ob.observe(el)
    return () => ob.disconnect()
  }, [editorElRef])
}
