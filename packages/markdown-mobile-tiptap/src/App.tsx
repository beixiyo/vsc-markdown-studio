import type { ImageOptions } from 'tiptap-nodes/image'
import { EditorContent } from '@tiptap/react'
import { notifyNative } from 'notify'
import { useMemo, useRef } from 'react'
import { useDefaultEditor } from 'tiptap-editor-core'
import { type SpeakerAttributes, SpeakerNode } from 'tiptap-nodes/speaker'
import DevPanel from './__dev__/DevPanel'
import { useNotifyChange } from './hooks/useNotify'
import { useSetupMDBridge } from './hooks/useSetupMDBridge'
import { speakerAttrsToNativePayload } from './speaker'

/**
 * 图片节点的事件回调：统一打到 Native
 *
 * 原则：
 * - payload 最小化 —— 只带 `id`（和当下 `pos` 方便定位），不带 `src` / `attrs`
 *   避免 base64 图片在每次事件里被整串搬运过桥接
 * - Native 想要完整属性时主动调 `MDBridge.getImageAttrs(id)` 按需拉取
 */
const imageOptions: Partial<ImageOptions> = {
  onClick: ({ attrs, pos }) => {
    if (!attrs.id)
      return
    notifyNative('imageTapped', { id: attrs.id, pos })
  },
  onLoad: ({ attrs }) => {
    if (!attrs.id)
      return
    notifyNative('imageLoaded', { id: attrs.id })
  },
  onError: ({ attrs }) => {
    if (!attrs.id)
      return
    notifyNative('imageLoadError', { id: attrs.id })
  },
  onRemove: ({ attrs }) => {
    if (!attrs.id)
      return
    notifyNative('imageRemoved', { id: attrs.id })
  },
  onUpdateAttrs: ({ prev, next }) => {
    if (!next.id)
      return
    /** 字段级 diff，不把完整 attrs 搬过去（可能含 base64 src） */
    const changed: Record<string, { prev: unknown, next: unknown }> = {}
    const keys = new Set([...Object.keys(prev), ...Object.keys(next)])
    for (const k of keys) {
      const p = (prev as any)[k]
      const n = (next as any)[k]
      if (p !== n)
        changed[k] = { prev: p, next: n }
    }
    /** 跳过首次 id 填充（prev.id 为空、next.id 刚生成）这种内部事务 */
    const onlyIdFilled = Object.keys(changed).length === 1 && changed.id && !prev.id && next.id
    if (onlyIdFilled || Object.keys(changed).length === 0)
      return
    notifyNative('imageAttrsChanged', { id: next.id, changed })
  },
}

export default function App() {
  const editorElRef = useRef<HTMLDivElement>(null)

  /**
   * SpeakerNode 的 `speakerMap` 在 editor 构造后就固化了；
   * 传空对象作为稳定引用，后续由 `useSetupMDBridge` 原地 mutate
   */
  const extensions = useMemo(() => [
    SpeakerNode.configure({
      speakerMap: {},
      onClick: (attrs: SpeakerAttributes) => {
        notifyNative('speakerTapped', speakerAttrsToNativePayload(attrs))
      },
    }),
  ], [])

  const editor = useDefaultEditor({ extensions, image: imageOptions })

  useSetupMDBridge(editor, editorElRef)
  useNotifyChange(editor, editorElRef)

  return (
    <>
      <div ref={ editorElRef } className="markdown-body">
        <EditorContent editor={ editor } />
      </div>
      { import.meta.env.DEV && <DevPanel /> }
    </>
  )
}
