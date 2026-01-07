import { useState } from 'react'
import { Button } from 'tiptap-comps'
import { CollaborationSplitPane } from '@/playground/collaboration/split-pane'
import { Editor } from '@/playground/editor'

export default function App() {
  const [mode, setMode] = useState<'editor' | 'collaboration'>('editor')

  return (
    <div className="h-screen">
      <div className="flex gap-2 p-4 border-b border-[var(--tt-border-color)]">
        <Button
          onClick={ () => setMode('editor') }
          data-active-state={ mode === 'editor'
            ? 'on'
            : 'off' }
          data-appearance="emphasized"
          className="px-4 py-2 text-sm"
        >
          普通编辑器
        </Button>
        <Button
          onClick={ () => setMode('collaboration') }
          data-active-state={ mode === 'collaboration'
            ? 'on'
            : 'off' }
          data-appearance="emphasized"
          className="px-4 py-2 text-sm"
        >
          协同编辑
        </Button>
      </div>

      { mode === 'editor'
        ? <Editor
          // initialMarkdown="[speaker:1] 和 [speaker:2]"
          speakerMap={ {
            1: { name: 'Alice', id: 'u1' },
            2: { name: 'Bob', id: 'u2' },
          } }
          onSpeakerClick={ (attrs) => {
            console.log('speaker click', attrs)
          } }
        />
        : <CollaborationSplitPane /> }
    </div>
  )
}
