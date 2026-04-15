import { EditorContent } from '@tiptap/react'
import { notifyNative } from 'notify'
import { useMemo, useRef } from 'react'
import { useDefaultEditor } from 'tiptap-editor-core'
import { type SpeakerAttributes, SpeakerNode } from 'tiptap-nodes/speaker'
import DevPanel from './__dev__/DevPanel'
import { useNotifyChange } from './hooks/useNotify'
import { useSetupMDBridge } from './hooks/useSetupMDBridge'
import { speakerAttrsToNativePayload } from './speaker'

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

  const editor = useDefaultEditor({ extensions })

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
