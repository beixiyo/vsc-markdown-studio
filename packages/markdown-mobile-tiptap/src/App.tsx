import type { ImageOptions } from 'tiptap-nodes/image'
import { EditorContent } from '@tiptap/react'
import { notifyNative } from 'notify'
import { lazy, Suspense, useMemo, useRef } from 'react'
import { RegionEdit } from 'tiptap-ai'
import { BlockId } from 'tiptap-diff'
import { useDefaultEditor } from 'tiptap-editor-core'
import { useBlockSyncBridge } from './hooks/useBlockSyncBridge'
import { useNotifyChange } from './hooks/useNotify'
import { useSetupMDBridge } from './hooks/useSetupMDBridge'

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

const DevPanel = import.meta.env.DEV
  ? lazy(() => import('./__dev__/DevPanel'))
  : null

export default function App() {
  const editorElRef = useRef<HTMLDivElement>(null)

  const extensions = useMemo(() => [
    /** AI 区域编辑（hash 锚点协议）预览装饰 */
    RegionEdit.configure(),
    /** 块级 id-diff 同步：给顶层块挂稳定 id（不进 markdown，仅进 PM state / getJSON） */
    BlockId.configure(),
  ], [])

  const editor = useDefaultEditor({ extensions, image: imageOptions, placeholder: false })

  useSetupMDBridge(editor, editorElRef)
  useNotifyChange(editor, editorElRef)
  /** 块级增量上报：变更经 contentDiff 事件发出，原生回执走 MDBridge.sync */
  useBlockSyncBridge(editor)

  const isDev = import.meta.env.DEV
  const editorClass = isDev
    ? 'markdown-body min-h-dvh'
    : 'markdown-body'
  const editorContent = (
    <div ref={ editorElRef } className={ editorClass }>
      <EditorContent editor={ editor } />
    </div>
  )

  if (!isDev)
    return editorContent

  return (
    <>
      <main className="min-h-dvh overflow-x-hidden bg-background lg:bg-background2 lg:pr-[420px]">
        <div className="mx-auto min-h-dvh w-full max-w-3xl bg-background px-4 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
          { editorContent }
        </div>
      </main>
      { DevPanel && (
        <Suspense fallback={ null }>
          <DevPanel />
        </Suspense>
      ) }
    </>
  )
}
