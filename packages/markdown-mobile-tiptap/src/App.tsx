import { EditorContent } from '@tiptap/react'
import { notifyNative } from 'notify'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useDefaultEditor } from 'tiptap-editor-core'
import { type SpeakerAttributes, SpeakerNode } from 'tiptap-nodes/speaker'
import { useNotifyChange } from './hooks/useNotify'
import { useSetupMDBridge } from './hooks/useSetupMDBridge'

type SpeakerMap = Record<string, { name: string, id?: string, label?: string }>

export default function App() {
  const editorElRef = useRef<HTMLDivElement>(null)
  const [speakerMap, setSpeakerMap] = useState<SpeakerMap>({})

  const extensions = useMemo(() => [
    SpeakerNode.configure({
      speakerMap,
      onClick: (attrs: SpeakerAttributes) => {
        notifyNative('speakerTapped', {
          label: attrs.label,
          originalLabel: attrs.originalLabel,
          id: attrs.id,
          name: attrs.name,
          speakerName: attrs.name
            ? `@${attrs.name}`
            : undefined,
        })
      },
    }),
  ], [speakerMap])

  const editor = useDefaultEditor({ extensions })

  const handleSetSpeakerMap = useCallback((map: SpeakerMap) => {
    setSpeakerMap(map)
  }, [])

  useSetupMDBridge(editor, handleSetSpeakerMap)
  useNotifyChange(editor, editorElRef)

  return (
    <div ref={ editorElRef } className="markdown-body">
      <EditorContent editor={ editor } />
    </div>
  )
}
